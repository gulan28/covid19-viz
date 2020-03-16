## README

This is a visualisation of COVID-19 spread in Kerala courtesy [http://dhs.kerala.gov.in/](http://dhs.kerala.gov.in/)
Cleaned data is in the `data` folder.

### How you can help

* Wash your hands :)
* The data is currently manually entered from the PDF files hosted on DHS website. You can add missing day's data by taking a screenshot of the table in pdf and using [https://online2pdf.com/convert-jpg-to-excel#](https://online2pdf.com/convert-jpg-to-excel#) to convert it into an excel file and then exporting it as csv. The file might contain misspelled characters. Fix them and format them according to `/data/data_*.csv` csv's and send a PR
* TODO items need to be fixed.

### Todo
* Show total values + infected counts (this is in dataIndex.js)
* No leading zeroes in dates because of how dates are parsed
