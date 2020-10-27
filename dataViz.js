
var selectedFeatureMap = {
  'hospitalized_today': 'Number of people hospitalized today.<br/><small>ആശുപത്രിയിൽ ഇന്ന് പ്രവേശിപ്പിച്ചവർ.</small>',
  'total_hospitalized': 'Total number of symptomatic people hospitalized.<br/><small>മൊത്തം ആശുപത്രിയിൽ പ്രവേശിപ്പിച്ചവർ.</small>',
  'isolation': 'Total number of people under isolation.<br/><small>മൊത്തം മാറ്റിപ്പാർപ്പിച്ചവർ.</small>',
  'observation': 'Total number of people under observation.<br/><small>മൊത്തം നിരീക്ഷണത്തിൽ ഉള്ളവർ.</small>',
  'active': 'Total number of people who have COVID-19.<br/><small>COVID-19 ബാധിച്ചു ശുശ്രുഷയിൽ ഉള്ളവർ.</small>',
};

var graphFeatureMap = {
  'active': 'People with COVID-19',
  'hospitalized_today': 'People hospitalized today',
  'total_hospitalized': 'Total people hospitalized',
  'isolation': 'People under isolation',
  'observation': 'People under observation',
}

var districtColorList = [
  '#e6739f',
  '#efb1ff',
  '#c06c84',
  '#ffac41',
  '#0f4c81',
  '#18b0b0',
  '#eca0b6',
  '#844685',
  '#649d66',
  '#40bad5',
  '#6886c5',
  '#9dc6a7',
  '#e8f044',
  '#a7e9af',
  '#d63447',
],
chartBg = '#f4eeff';


// load data
var data = {},
  selected_date = '',
  selected_feature = 'active',
  prevDaySample = 0;

var dates = [],
  dateLabels = [],
  dateSelect = d3.select('#dateSelect'),
  active = [],
  positive = [],
  recovered = [],
  deaths = [],
  totSample = [],
  positiveToday = [],
  tpRate = [],
  tpRateMovAvg = [];

Object.keys(dataIndex.daily_bulletin).forEach(function(key) {
  var curdate = d3.timeParse('%d-%m-%Y')(key);
  var item = dataIndex.daily_bulletin[key];
  dates.push(key);
  dateLabels.push(curdate);
  selected_date = key;
  active.push(item.total_active);
  positive.push(item.total_positive);
  deaths.push(item.deaths);
  var totTodaySample = item.sample_negative - prevDaySample;
  var totTodayDoneSample = totTodaySample + item.positive_today
  totSample.push(totTodayDoneSample);
  positiveToday.push(item.positive_today);
  var tpRateToday = (item.positive_today > 0 ? item.positive_today / totTodayDoneSample * 100 : 0);
  tpRate.push(tpRateToday.toFixed(2));
  // subtracted 4. refer to https://dashboard.kerala.gov.in/dailyreporting.php
  recovered.push((item.total_positive - (item.total_active + item.deaths + 104)));
});

tpRateMovAvg = movingAvg(7, positiveToday, totSample);

var summaryConfig = {
  type: 'line',
  data: {
    labels: dateLabels,
    datasets: [
      {
        label: 'Total positive',
        data: positive,
        borderColor: '#1f4068',
        backgroundColor: '#1f4068',
        fill: false,
        pointRadius: 2,
      },
      {
        label: 'Active',
        data: active,
        borderColor: '#ffa34d',
        backgroundColor: '#ffa34d',
        fill: false,
        pointRadius: 2,
      },
      {
        label: 'Recovered',
        data: recovered,
        borderColor: '#1eb2a6',
        backgroundColor: '#1eb2a6',
        fill: false,
        pointRadius: 2,
      },
      {
        label: 'Deaths',
        data: deaths,
        borderColor: '#b80d57',
        backgroundColor: '#b80d57',
        fill: false,
        pointRadius: 2,
      }
    ]
  },
  options: {
    responsive: true,
    title: {
      display: false
    },
    tooltips: {
      mode: 'index',
      intersect: false,
    },
    hover: {
      mode: 'nearest',
      intersect: true
    },
    scales: {
      xAxes: [{
        display: true,
        type: 'time',
        distribution: 'series',
        scaleLabel: {
          display: true,
          labelString: 'Date'
        }
      }],
      yAxes: [{
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Value'
        }
      }]
    },
  }
};

var sampleOffset = -25
var sampleConfig = {
  type: 'bar',
  data: {
    labels: dateLabels.slice(sampleOffset),
    datasets: [
      {
        type: 'line',
        label: 'Test positivity rate (TPR)',
        yAxisID: 'tpr',
        data: tpRate.slice(sampleOffset),
        borderColor: '#FDBB07',
        backgroundColor: '#FDBB07',
        fill: false,
        hidden: true,
        pointRadius: 3,
      },
      {
        type: 'line',
        label: 'Test positivity rate (TPR) (7 day moving avg)',
        yAxisID: 'tpr',
        data: tpRateMovAvg.slice(sampleOffset),
        borderColor: '#31a354',
        backgroundColor: '#31a354',
        fill: false,
        pointRadius: 3,
      },
      {
        type: 'bar',
        label: 'Tests done today',
        yAxisID: 'ttc',
        data: totSample.slice(sampleOffset),
        borderColor: '#1f4068',
        backgroundColor: '#1f4068',
        fill: true,
        pointRadius: 2,
      },
      {
        type: 'bar',
        label: 'Positive cases found',
        yAxisID: 'ttc',
        data: positiveToday.slice(sampleOffset),
        borderColor: '#D4425A',
        backgroundColor: '#D4425A',
        fill: true,
        pointRadius: 2,
      }
    ]
  },
  options: {
    responsive: true,
    title: {
      display: false
    },
    tooltips: {
      mode: 'index',
      intersect: false,
    },
    hover: {
      mode: 'nearest',
      intersect: true
    },
    scales: {
      xAxes: [{
        display: true,
        type: 'time',
        distribution: 'series',
        stacked: true,
        offset: true,
        scaleLabel: {
          display: true,
          labelString: 'Date'
        }
      }],
      yAxes: [{
        id: 'ttc',
        display: true,
        position: 'left',
        stacked: true,
        scaleLabel: {
          display: true,
          labelString: 'Value'
        }
      },{
        id: 'tpr',
        position: 'right',
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Test positivity rate'
        }
      }]
    },
  }
};

var config = {
  type: 'line',
  data: {
    labels: dateLabels,
    datasets: [
    ]
  },
  options: {
    responsive: true,
    title: {
      display: false
    },
    tooltips: {
      mode: 'index',
      intersect: false,
    },
    hover: {
      mode: 'nearest',
      intersect: true
    },
    scales: {
      xAxes: [{
        display: true,
        type: 'time',
        distribution: 'series',
        scaleLabel: {
          display: true,
          labelString: 'Date'
        }
      }],
      yAxes: [{
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Value'
        }
      }]
    },
  }
};


var myChart = null, summaryChart = null, sampleChart = null;

window.onload = function() {
  var graph_selected_feature = 'active';
  var chartElem = document.getElementById('myChart');
  var summaryChartElem = document.getElementById('summaryChart');
  var chartCtx = chartElem.getContext('2d');
  var summaryCtx = summaryChartElem.getContext('2d');
  var sampleElem = document.getElementById('sampleChart');
  var sampleCtx = sampleElem.getContext('2d');

  myChart = new Chart(chartCtx, config);
  summaryChartElem.style.backgroundColor = chartBg;
  summaryChart = new Chart(summaryCtx, summaryConfig);
  sampleChart = new Chart(sampleCtx, sampleConfig);

  d3.json('./data/' + dataIndex.pivot.file).then(function(pivotData) {
    var parsedData = {};
    Object.keys(pivotData).forEach(function(districtName) {
      var districtData = pivotData[districtName];
      var parsedDistrictData = districtData.map(function(item) {
        item.date = d3.timeParse('%Y-%m-%d')(item.date);
        item.observation = parseInt(item.observation);
        item.isolation = parseInt(item.isolation);
        item.total_hospitalized = parseInt(item.total_hospitalized);
        item.hospitalized_today = parseInt(item.hospitalized_today);
        item.active = parseInt(item.active);
        return item;
      });
      parsedData[districtName] = parsedDistrictData;
    });
    // add to chart data
    function updateGraph() {
      // initialize datasets
      config.data.datasets = [];
      config.options.scales.yAxes[0].scaleLabel.labelString = graphFeatureMap[graph_selected_feature];
      Object.keys(parsedData).forEach(function(key, index) {
        var districtData = parsedData[key].sort(function(a, b) { return a.date-b.date; });
        var newDataset = {
          label: key,
          data: districtData.map(function (item) { return item[graph_selected_feature]; }),
          fill: false,
          borderColor: districtColorList[index],
          backgroundColor: districtColorList[index],
          hidden: (key !== 'Total'),
          pointRadius: 4,
          pointHoverRadius: 10,
        };
        config.data.datasets.push(newDataset);
        myChart.update();
      });
    }
    // initialize graph feature change option
    var graphFeatureSelect = d3.select('#graphFeatureSelect');
    graphFeatureSelect.property('value', graph_selected_feature);
    graphFeatureSelect.on('change', graphFeatureChangeListener);
    // listener for graph feature selector
    function graphFeatureChangeListener() {
      if (this.selectedOptions.length > 0) {
        var selOpt = this.selectedOptions[0].value;
        graph_selected_feature = selOpt;
      }
      updateGraph();
    }
    // running updategraph for the first time
    updateGraph();
  });
}

var map = L.map('map', {
  attributionControl: false
}).setView([10.42, 76.47], 6.5);
var lat, lng;
var col_range = ['#ffeda0', '#f03b20'];
var colorfunc = function(d) {
  return col_range[0]
}

// tile base layer from mapbox to give context
var mapbox_token = 'pk.eyJ1IjoiZ3VsYW4yOCIsImEiOiJjazd2cGp5OGgwd21kM2xwMHV6ZjA3ZXNvIn0.1OeMxwjB5QV-2DgEhStX9w';
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + mapbox_token, {
  maxZoom: 18,
  id: 'gulan28/ck7vplv1i0tl91iqlb4oz6ofy',
  tileSize: 512,
  zoomOffset: -1
}).addTo(map);

// helpers

function movingAvg(windowsize, positive, total) {
    var p1 = positive[0], pn = positive[0], mavg = 0;
    var t1 = total[0], tn = total[0];
    var totSum = 0, posSum = 0;
    var mavgList = [];
    for (var i=0; i<positive.length; i++) {
        pn = positive[i];
        tn = total[i]
        if (i < windowsize) {
            totSum = totSum + tn;
            posSum = posSum + pn;
        } else {
            p1 = positive[i - windowsize];
            t1 = total[i - windowsize];
            totSum = totSum + tn - t1;
            posSum = posSum + pn - p1;
        }
        mavg = posSum / totSum;
        mavgList.push((mavg * 100).toFixed(2));
    }
    return mavgList;
}

function getLatestDate(dateArr) {
  var dd, mm, yyyy, spl, newd;
  var convDateList = dateArr.map(function(d) {
    spl = d.split('-');
    dd = spl[0];
    mm = parseInt(spl[1]);
    yyyy = spl[2];
    return new Date(yyyy, mm - 1, dd);
  })
  var nd = new Date(Math.max.apply(null, convDateList));
  return nd.getDate() + '-' + (nd.getMonth() + 1) + '-' + nd.getFullYear();
}

// dates in reverse order
dates.reverse();
selected_date = getLatestDate(dates);
// add dates to select
var opts = dateSelect.selectAll(null)
  .data(dates)
  .enter()
  .append('option')
  .attr('value', function(d) {
    return d;
  })
  .text(function(d) {
    return d;
  })


var info = L.control();

info.onAdd = function(map) {
  this._div = L.DomUtil.create('div', 'info');
  this.update();
  return this._div;
};

info.update = function(props) {
  this._div.innerHTML = '<h5>' + (selected_feature.length > 0 ? selectedFeatureMap[selected_feature] : 'Select a feature to display') + '</h5>' + (props ?
    '<b>' + props.district + '</b><br/>' + props[selected_feature] + ' people' :
    'Click/touch a district.<br/><small>ഒരു ജില്ലയിൽ തൊടു.</small>');
};

var legend = L.control({
  position: 'bottomleft'
});

legend.onAdd = function(map) {
  this._div = L.DomUtil.create('div', 'info legend');
  this.update();
  return this._div;
}

legend.update = function() {
  var rmin, rmax, intervals = [];
  var self = this;
  // clears innerHTML
  self._div.innerHTML = '';
  if (selected_date.length > 0 &&
    selected_feature.length > 0 &&
    Object.keys(data).length > 0) {
    var d = data[selected_date].filter(function(item) {
      return item.district.toLowerCase() !== 'total'
    });
    rmin = d3.min(d, function(item) {
      return parseInt(item[selected_feature])
    });
    rmax = d3.max(d, function(item) {
      return parseInt(item[selected_feature])
    });
  }
  if (rmax === 0) {
    rmax = 100;
  }
  for (var i = rmin; i <= rmax; i += Math.ceil((rmax - rmin) / 5)) {
    intervals.push(i);
  }
  for (var i = 0; i < intervals.length; i++) {
    self._div.innerHTML +=
      '<i style="background:' + colorfunc(intervals[i] + 1) + '"></i> ' +
      intervals[i] + (intervals[i + 1] ? '&ndash;' + intervals[i + 1] + '<br>' : '+');
  }
}

function infobarUpdate() {
  var infobar = d3.select('#infobar');
  var dateStr = moment(d3.timeParse('%d-%m-%Y')(selected_date)).format('MMMM Do YYYY');
  if (selected_date !== undefined) {
    infobar.html('<p class="subtitle is-5"><b>'+dateStr+'</b></p>'+
      '<p class="subtitle is-5">Cases reported today: <b>'+
      dataIndex.daily_bulletin[selected_date]['positive_today'] +'</b></p>'+
      '<p class="subtitle is-5">Total active cases in Kerala: <b>' +
      dataIndex.daily_bulletin[selected_date]['total_active'] +
      '</b>  Deaths: <b>' + dataIndex.daily_bulletin[selected_date]['deaths'] +  '</b></p>' +
      '<p class="subtitle is-5"> Total cases recorded: <b>' + dataIndex.daily_bulletin[selected_date]['total_positive'] + '</b></p>' +
      '<p class="subtitle is-6"> New samples sent: <b>' + dataIndex.daily_bulletin[selected_date]['sample_sent'] +
      '</b> Samples negative: <b>' + dataIndex.daily_bulletin[selected_date]['sample_negative'] + '</b></p>')
  }
}

function highlightFeature(e) {
  var layer = e.target;
  resetAll();
  layer.setStyle({
    weight: 5,
    color: '#666',
    dashArray: '',
    fillOpacity: 0.7
  });

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }
  info.update(getDataForDistrict(layer.feature.properties.DISTRICT));
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: highlightFeature,
  });
}

function getColorRangeFunc(range_min, range_max) {
  return d3.scaleLinear()
    .range(col_range)
    .domain([range_min, range_max])
    .interpolate(d3.interpolateLab);
}

function getDataForDistrict(district) {
  var focus_item = null;
  if (Object.keys(data).length > 0) {
    d = data[selected_date];
    d.forEach(function(item) {
      if (item.district.toLowerCase() === district.toLowerCase()) {
        focus_item = item;
      }
    });
  }
  return focus_item;
}

function setDataColorFunc() {
  if (selected_date.length > 0 &&
    selected_feature.length > 0 &&
    Object.keys(data).length > 0) {
    var d = data[selected_date].filter(function(item) {
      return item.district.toLowerCase() !== 'total'
    });
    var rmin = d3.min(d, function(item) {
      return parseInt(item[selected_feature])
    });
    var rmax = d3.max(d, function(item) {
      return parseInt(item[selected_feature])
    });
    colorfunc = getColorRangeFunc(rmin, rmax);
  }
}

function getDataColor(district) {
  if (selected_date.length > 0 &&
    district &&
    selected_feature.length > 0 &&
    Object.keys(data).length > 0) {
    var focus_item = getDataForDistrict(district);
    if (focus_item) {
      return colorfunc(focus_item[selected_feature]);
    }

  }
  return col_range[0];
}

function style(feature) {
  return {
    fillColor: getDataColor(feature.properties.DISTRICT),
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.6
  };
}

var geojson = L.geoJson(stateData, {
  style: style,
  onEachFeature: onEachFeature,
}).addTo(map);
info.addTo(map);
legend.addTo(map);

function resetHighlight(e) {
  var layer = e.target;
  geojson.resetStyle(e.target);
  layer.setStyle({
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
  });
  info.update();
}

function resetAll() {
  geojson.resetStyle();
}

function updateAll() {
  setDataColorFunc();
  geojson.setStyle(style);
  legend.update();
  info.update();
  infobarUpdate();
}


// set default for featureSelect and dateSelect
var featureSelect = d3.select('#featureSelect')
featureSelect.property('value', selected_feature);
dateSelect.property('value', selected_date);

featureSelect.on('change', featureChangeListener);
dateSelect.on('change', dateChangeListener);
// listener for feature change
function featureChangeListener() {
  if (this.selectedOptions.length > 0) {
    var selOpt = this.selectedOptions[0].value;
    selected_feature = selOpt;
    updateAll();
  }
}
// listener for date change

function dateChangeListener() {
  if (this.selectedOptions.length > 0) {
    var date = this.selectedOptions[0].value;
    fetchDataForDate(date);
  }
}

function fetchDataForDate(date) {
  if (Object.keys(data).includes(date)) {
    selected_date = date;
    updateAll();
  } else {
    var filename = './data/' + dataIndex.daily_bulletin[date].file;
    d3.csv(filename).then(function(dat) {
      data[date] = dat;
      selected_date = date;
      updateAll();
    });
  }
}

// fetch data for initial date
fetchDataForDate(selected_date);
infobarUpdate();

// // tab switching code
// var tabs = d3.selectAll('#tabs li');
// tabs.on('click', function() {
//   var self = d3.select(this);
//   var tabNum = self.attr('data-tab');
//   tabs.classed('is-active', false);
//   self.classed('is-active', true);
//
//   d3.selectAll('#tab-container section').classed('is-active', false);
//   d3.selectAll('#tab-container section[data-content="' + tabNum + '"]').classed('is-active', true);
// });
