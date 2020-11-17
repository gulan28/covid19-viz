#! /bin/bash

TODAY=`date +'%Y-%m-%d'`;
numargs=$#;
args=$@;
if [ "$numargs" -ne "0" ]; then
    echo "Running scrape for $args";
    pipenv run python scrape.py $args;
else
    echo "Running scrape for $TODAY";
    pipenv run python scrape.py;
fi
echo ""
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
