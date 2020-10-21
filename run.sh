#! /bin/bash

TODAY=`date +'%Y-%m-%d'`;
echo "Running scrape for $TODAY";
echo ""
pipenv run python scrape.py;
echo "Scraping worked? (y/n)? ";
read answer;
if [ "$answer" != "${answer#[Yy]}" ] ;then
    echo "Running pivot maker and committing changes";
    pipenv run python pivot_maker.py;
    git status;
    git add .;
    git commit -m "Adding data for $TODAY";
    git push;
else
    echo "Exiting";
    echo ""
fi
