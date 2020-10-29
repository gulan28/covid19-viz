from bs4 import BeautifulSoup
import csv
import copy
from collections import defaultdict
from datetime import date, timedelta
import json
import os
import re
import requests
import sys
import time

district_map = {
    "TVM": "Thiruvananthapuram",
    "KLM": "Kollam",
    "PTA": "Pathanamthitta",
    "IDK": "Idukki",
    "KTM": "Kottayam",
    "ALP": "Alappuzha",
    "EKM": "Ernakulam",
    "TSR": "Thrissur",
    "PKD": "Palakkad",
    "MPM": "Malappuram",
    "KKD": "Kozhikode",
    "WYD": "Wayanad",
    "KNR": "Kannur",
    "KGD": "Kasaragod",
    "TOTAL": "Total",
}

district_code_map = {
    "1601": "KGD",
    "1602": "KNR",
    "1603": "WYD",
    "1604": "KKD",
    "1605": "MPM",
    "1606": "PKD",
    "1607": "TSR",
    "1608": "EKM",
    "1609": "IDK",
    "1610": "KTM",
    "1611": "ALP",
    "1612": "PTA",
    "1613": "KLM",
    "1614": "TVM",
}

QUARANTINE_HEADER = [
    "district",
    "observation",
    "total_hospitalized",
    "isolation",
    "hospitalized_today",
]

CASE_HEADER = ["confirmed", "recovered", "active", "deaths"]
ACTIVE_HEADER = ["date"]
ACTIVE_HEADER.extend(CASE_HEADER)
ACTIVE_TODAY_HEADER = ["district"]
ACTIVE_TODAY_HEADER.extend(CASE_HEADER)
CSV_HEADER = copy.deepcopy(QUARANTINE_HEADER)
CSV_HEADER.extend(CASE_HEADER)
TESTING_HEADER = [
    "date",
    "total_sent",
    "sent_on_date",
    "processed_in_one_day",
    "total_positive",
    "new_positive",
]
TEST_DATA_JSON = "./testData.json"
DATA_INDEX_JSON = "./dataIndexJSON.json"
DATA_INDEX_JS = "./dataIndex.js"
INIT_URL = "https://dashboard.kerala.gov.in"
QAR_REQ_URL = "https://dashboard.kerala.gov.in/quarantined-datewise.php"
ACTIVE_REQ_URL = (
    "https://dashboard.kerala.gov.in/dailyreporting-view-public-districtwise.php"
)
TESTING_REQ_URL = "https://dashboard.kerala.gov.in/testing-view-public.php"
DATE_REQ_STRING = "rep_date3"
HEADERS = {
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-User": "?1",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36",
    "Origin": "https://dashboard.kerala.gov.in",
    "Referer": "https://dashboard.kerala.gov.in/quarantined-datewise.php",
}


def get_date(datearg):
    dsplit = [int(i) for i in re.split(r"[-/]\s*", datearg)]
    return date(day=dsplit[0], month=dsplit[1], year=dsplit[2])


def csv_writer(filepath, data):
    with open(filepath, "w") as f:
        w = csv.DictWriter(f, fieldnames=set(CSV_HEADER))
        w.writeheader()
        w.writerows(data)


def init_sess():
    try:
        # warm up the cookies
        sess = requests.Session()
        sess.get(INIT_URL, headers=HEADERS)
    except requests.exceptions.RequestException as e:
        print(e)
    else:
        return sess


def run_req(sess, url, data, headers, method="GET"):
    kwargs = {}
    if method == "GET":
        req_func = sess.get
    elif method == "POST":
        req_func = sess.post
        kwargs["data"] = data
    kwargs["headers"] = headers
    try:
        response = req_func(url, **kwargs)
    except requests.exceptions.RequestException as e:
        print(e)
    else:
        return response


def get_quarantine_details(date):
    sess = init_sess()
    date_str = date.strftime("%d/%m/%Y")
    payload = {DATE_REQ_STRING: date_str, "lw": "View"}
    csv_data = []
    response = run_req(sess, QAR_REQ_URL, payload, HEADERS, "POST")
    if not response:
        return
    soup = BeautifulSoup(response.content, "html.parser")
    table = soup.find_all("table")[0]
    for row in table.find_all("tr")[1:]:
        cols = [i.text for i in row.find_all("td")]
        district = cols[0]
        data_dict = dict(zip(QUARANTINE_HEADER, cols))
        data_dict["dist_code"] = district
        data_dict["district"] = district_map[district]
        csv_data.append(data_dict)
    return csv_data


def extract_datewise_active(soup, district):
    datalist = []
    # assumes last table is the datewise table
    table = soup.find_all("table")[-1]
    for row in table.find_all("tr")[1:]:
        cols = [i.text for i in row.find_all("td")]
        data_dict = dict(zip(ACTIVE_HEADER, cols))
        data_dict["date"] = get_date(data_dict["date"])
        data_dict["district"] = district
        datalist.append(data_dict)
    return datalist


def get_active_details_today():
    active_data = defaultdict(list)
    sess = init_sess()
    response = run_req(sess, ACTIVE_REQ_URL, None, HEADERS, "GET")
    if not response:
        print("response failed for today's active case details")
        return
    if len(response.content) < 1000:
        print(len(response.content), " Actual response not recieved")
        return
    soup = BeautifulSoup(response.content, "html.parser")
    region = soup.find_all(text=re.compile("you have chosen", re.I))[0]
    print("Got data for {}".format(region.next_sibling.text))
    last_date = soup.find_all(text=re.compile("updated", re.I))[0].split()[1]
    last_date = get_date(last_date)
    # assumes second last table is the summary table
    table = soup.find_all("table")[-2]
    for row in table.find_all("tr")[1:]:
        cols = [i.text for i in row.find_all("td")]
        data_dict = dict(zip(ACTIVE_TODAY_HEADER, cols))
        data_dict["date"] = last_date
        district = data_dict["district"]
        active_data[district].append(data_dict)
    # are there 14 district data + total data
    assert len(active_data) == 15
    # get kerala datewise details table as well
    kerala_data = {i["date"]: i for i in extract_datewise_active(soup, "KERALA")}
    return (kerala_data, active_data, last_date)


def get_bulk_active_details():
    active_data = {}
    time.sleep(5)
    for code, district in district_code_map.items():
        # new session for each district data
        sess = init_sess()
        print("Processing: {}".format(district))
        payload = {"district": code}
        response = run_req(sess, ACTIVE_REQ_URL, payload, HEADERS, "POST")
        if not response:
            print("response failed for district {}".format(district))
            break
        if len(response.content) < 1000:
            print(len(response.content), " Actual response not recieved")
            break
        soup = BeautifulSoup(response.content, "html.parser")
        region = soup.find_all(text=re.compile("you have chosen", re.I))[0]
        print("Got data for {}".format(region.next_sibling.text))
        # assumes last table is the datewise table
        active_data[district] = extract_datewise_active(soup, district)
        time.sleep(5)
    return active_data


def get_testing_details():
    testing_data = {}
    sess = init_sess()
    response = run_req(sess, TESTING_REQ_URL, None, HEADERS, "GET")
    if not response:
        print("response failed for today's active case details")
        return
    if len(response.content) < 1000:
        print(len(response.content), " Actual response not recieved")
        return
    print("Processing testing data")
    soup = BeautifulSoup(response.content, "html.parser")
    case_report = soup.find_all(text=re.compile("Daily Case Reports from", re.I))[0]
    table = case_report.parent.parent.parent.find_all("table")[0]
    for row in table.find_all("tr")[1:]:
        cols = [i.text for i in row.find_all("td")]
        data_dict = dict(zip(TESTING_HEADER, cols))
        test_date = get_date(data_dict["date"])
        data_dict["date"] = test_date
        testing_data[test_date] = data_dict
    return testing_data


def active_detail_pivot(active_data, get_only_curr=False):
    pivot_data = defaultdict(dict)
    for district, values in active_data.items():
        count = {"district": district, "confirmed": 0, "deaths": 0, "recovered": 0}
        for value in values:
            v_date = value["date"]
            for key in ["confirmed", "deaths", "recovered"]:
                count[key] += int(value[key])
            count["active"] = int(value["active"])
            pivot_data[v_date][district] = copy.deepcopy(count)
    # set total if get_only_curr is False
    if not get_only_curr:
        for d, dist_dict in pivot_data.items():
            total = {
                "confirmed": 0,
                "deaths": 0,
                "recovered": 0,
                "active": 0,
            }
            for district, value in dist_dict.items():
                for key in total.keys():
                    total[key] += int(value[key])
            total["district"] = "TOTAL"
            dist_dict["TOTAL"] = total
    return pivot_data


def edit_data_index(date_list, totals_data, testing_data, kerala_data):
    di_data = None
    # write test_data into testdatajson
    with open(TEST_DATA_JSON, "w") as test_json:
        td = {}
        for d, v in testing_data.items():
            strdate = "{}-{}-{}".format(d.day, d.month, d.year)
            td[strdate] = {key: val for key, val in v.items() if key != "date"}
        json.dump(td, test_json)
        print("Wrote testing data to: {}".format(TEST_DATA_JSON))
    with open(DATA_INDEX_JSON, "r") as json_file:
        di_data = json.load(json_file)
    for d in date_list:
        entry = {}
        total_day = totals_data[d]
        try:
            testing_day = testing_data[d]
        except KeyError:
            print("data not available for {}".format(d))
            prevday = d - timedelta(days=1)
            print("trying for {}".format(prevday))
            # if data isn't available for current day, show previous day data
            testing_day = testing_data[prevday]
        kd = kerala_data[d]
        entry["total_active"] = int(total_day["active"])
        entry["total_positive"] = int(total_day["confirmed"])
        entry["deaths"] = int(total_day["deaths"])
        entry["positive_today"] = int(kd["confirmed"])
        entry["sample_sent"] = int(testing_day["total_sent"])
        entry["sample_sent_today"] = int(testing_day["sent_on_date"])
        entry["total_passengers"] = 0
        filename = "data_{}_{}_{}.csv".format(d.day, d.month, d.year)
        entry["file"] = filename
        datestr = "{}-{}-{}".format(d.day, d.month, d.year)
        di_data["daily_bulletin"][datestr] = entry
    with open(DATA_INDEX_JSON, "w") as json_file:
        json.dump(di_data, json_file)
        print("Wrote index data to: {}".format(DATA_INDEX_JSON))
    with open(DATA_INDEX_JS, "w") as js_file:
        write_str = "var dataIndex = " + str(di_data)
        js_file.write(write_str)
        print("Wrote index data to: {}".format(DATA_INDEX_JS))


def get_data_for_date(dates=[], get_only_curr=False):
    kd, active_today, updated_date = get_active_details_today()
    if not get_only_curr:
        active_data = get_bulk_active_details()
    else:
        assert dates[0] == updated_date, "Date mismatch. Site updated till {}".format(
            updated_date
        )
        active_data = active_today
    time.sleep(2)
    testing_data = get_testing_details()
    time.sleep(3)
    active_data_pivot = active_detail_pivot(active_data, get_only_curr)
    totals_data = {}
    for d in dates:
        qar_data = get_quarantine_details(d)
        active = active_data_pivot[d]
        if not active:
            print("Active details empty for date: {}".format(d))
            continue
        csv_data = []
        for dat in qar_data:
            dist_code = dat.pop("dist_code")
            dist_active = active[dist_code]
            for key in CASE_HEADER:
                dat[key] = dist_active[key]
            # take active count from kerala data
            if dist_code == "TOTAL":
                dat["active"] = kd[d]["active"]
            csv_data.append(dat)
        # set total data
        totals_data[d] = active["TOTAL"]
        totals_data[d]["active"] = kd[d]["active"]
        # write to csv
        filename = "data_{}_{}_{}.csv".format(d.day, d.month, d.year)
        filepath = os.path.join("./data/", filename)
        print("writing csv for {}".format(d))
        csv_writer(filepath, csv_data)
        time.sleep(2)
    edit_data_index(dates, totals_data, testing_data, kd)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        dateargs = sys.argv[1:]
        print("processing for these dates: {}".format(dateargs))
        dates = [get_date(datearg) for datearg in dateargs]
        get_only_curr = False
    else:
        dates = [date.today()]
        get_only_curr = True
    get_data_for_date(dates, get_only_curr)
