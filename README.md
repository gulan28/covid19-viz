## README

This is a visualisation of COVID-19 spread in Kerala courtesy [http://dhs.kerala.gov.in/](http://dhs.kerala.gov.in/)
Cleaned data is in the `data` folder.

### Adding new daily bulletin data

* The data is currently manually entered from the PDF files hosted on DHS website. You can add missing day's data by taking a screenshot of the table in pdf and using [https://online2pdf.com/convert-jpg-to-excel#](https://online2pdf.com/convert-jpg-to-excel#) to convert it into an excel file and then exporting it as csv. The file might contain misspelled characters. Fix them and format them according to `/data/data_*.csv` csv's.
* Once you have done this, `cd` to the parent project folder and run
  `python pivot_maker.py`
  Which will create a new `total.csv` and `pivot.json` in the data folder. You can commit that new file and issue a PR.

### Todo
* Wash your hands :)
* use `/data/pivot.json` to display the data instead of requesting individual csv's
* Add and show total values and total infected counts.
* Cleaner code / use C3 for displaying charts. (C3 had a bug where chart sizes weren't correct)
* No leading zeroes in dates because of how dates are parsed
