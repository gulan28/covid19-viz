from bs4 import BeautifulSoup
import csv
from datetime import date
import os
import re
import requests
import sys


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
    "WND": "Wayanad",
    "KNR": "Kannur",
    "KGD": "Kasaragod",
    "TOTAL": "Total"
}

CSV_HEADER = ['district', 'observation', 'total_hospitalized', 'isolation', 'hospitalized_today']
REQ_URL = "https://dashboard.kerala.gov.in/ajax_quar_dte_list.php"
DATE_REQ_STRING = 'rdate'

def csv_writer(filepath, data):
    with open(filepath, 'w') as f:
        w = csv.DictWriter(f, fieldnames=set(CSV_HEADER))
        w.writeheader()
        w.writerows(data)


def get_data_for_date(date):
    # expects a date object
    date_str = date.strftime("%d/%m/%Y")
    payload = {DATE_REQ_STRING: date_str}
    csv_data = []
    try:
        response = requests.post(REQ_URL, data=payload)
    except requests.exceptions.RequestException  as e:
        print(e)
    else:
        soup = BeautifulSoup(response.content, "html.parser")
        for row in soup.find_all('tr'):
            cols = [i.text for i in row.find_all('td')]
            district = cols[0]
            data_dict = dict(zip(CSV_HEADER, cols))
            data_dict['district'] = district_map[district]
            csv_data.append(data_dict)
        filename = 'data_{}_{}_{}.csv'.format(date.day, date.month, date.year)
        filepath = os.path.join('./data/',filename)
        print('writing csv for {}'.format(date_str))
        csv_writer(filepath, csv_data)


if __name__ == '__main__':
    if len(sys.argv) > 1:
        datearg = sys.argv[1]
        dsplit = [int(i) for i  in re.split(r'[-/]\s*', datearg)]
        dateobj = date(day=dsplit[0], month=dsplit[1], year=dsplit[2])
    else:
        dateobj = date.today()
    get_data_for_date(dateobj)
