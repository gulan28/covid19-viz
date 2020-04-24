from bs4 import BeautifulSoup
import csv
from datetime import date
import os
import re
import requests
import sys


district_map = {
    'TVM': 'Thiruvananthapuram',
    'KLM': 'Kollam',
    'PTA': 'Pathanamthitta',
    'IDK': 'Idukki',
    'KTM': 'Kottayam',
    'ALP': 'Alappuzha',
    'EKM': 'Ernakulam',
    'TSR': 'Thrissur',
    'PKD': 'Palakkad',
    'MPM': 'Malappuram',
    'KKD': 'Kozhikode',
    'WND': 'Wayanad',
    'KNR': 'Kannur',
    'KGD': 'Kasaragod',
    'TOTAL': 'Total'
}

CSV_HEADER = ['district', 'observation', 'total_hospitalized', 'isolation', 'hospitalized_today']
INIT_URL = 'https://dashboard.kerala.gov.in'
REQ_URL = 'https://dashboard.kerala.gov.in/quarantine-view-public.php'
DATE_REQ_STRING = 'rep_date'
HEADERS = {
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-User': '?1',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36',
    'Origin': 'https://dashboard.kerala.gov.in',
    'Referer': 'https://dashboard.kerala.gov.in/quarantine-view-public.php'
}

def csv_writer(filepath, data):
    with open(filepath, 'w') as f:
        w = csv.DictWriter(f, fieldnames=set(CSV_HEADER))
        w.writeheader()
        w.writerows(data)


def get_data_for_date(date):
    # expects a date object
    date_str = date.strftime('%d/%m/%Y')
    payload = {DATE_REQ_STRING: date_str, 'vw': 'View'}
    csv_data = []
    try:
        sess = requests.Session()
        _throwaway = sess.get(INIT_URL, headers=HEADERS)
        response = sess.post(REQ_URL, data=payload, headers=HEADERS)
    except requests.exceptions.RequestException  as e:
        print(e)
    else:
        soup = BeautifulSoup(response.content, 'html.parser')
        table = soup.find_all('table')[0]
        for row in table.find_all('tr')[1:]:
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
