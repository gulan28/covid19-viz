from collections import defaultdict
import csv
import glob
import json
import os
import re

FILE_REG = re.compile('^data_(?P<day>\d+)_(?P<month>\d+)_(?P<year>\d+)\.csv', re.I)

def process_csv():
    csvpath = './data/*.csv'
    csvlist = glob.glob(csvpath)
    data = {}
    for filepath in csvlist:
        filename = os.path.basename(filepath)
        if FILE_REG.match(filename):
            rows = []
            with open(filepath, 'r') as csvfile:
                for r in csv.DictReader(csvfile):
                    # cleaning up data. remove empty keys
                    if '' in r:
                        del r['']
                    rows.append(r)
                data[filename] = rows
    return data


def get_date(filename):
    match_obj = FILE_REG.search(filename)
    if match_obj:
        day = match_obj.group('day')
        month = match_obj.group('month')
        year = match_obj.group('year')
        #  return in YYYY-MM-DD format for js Date.parse to work
        return "{}-{}-{}".format(year, month, day)
    return None


def csv_writer(filepath, data):
    with open(filepath, 'w') as f:
        w = csv.DictWriter(f, fieldnames=set([key for row in data for key in row.keys()]))
        w.writeheader()
        w.writerows(data)


def create_total_pivot():
    pivot_dict = defaultdict(list)
    print("Creating pivot files")
    data = process_csv()
    for fname in data.keys():
        date = get_date(fname)
        for i in data[fname]:
            district = i['district']
            del i['district']
            i['date'] = date
            pivot_dict[district].append(i)
    with open('./data/pivot.json', 'w') as jsonfile:
        json.dump(pivot_dict, jsonfile)
    csv_writer('./data/total.csv', pivot_dict['Total'])
    print("Created")


if __name__ == '__main__':
    create_total_pivot()
                
