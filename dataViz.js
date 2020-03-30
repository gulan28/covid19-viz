// set the dimensions and margins of the graph
// TODO set this according to deviceHeight and deviceWidth
var margin = {
    top: 10,
    right: 5,
    bottom: 30,
    left: 30
  },
  width,
  height = 400 - margin.top - margin.bottom;

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

var svg = d3.select('#graph')
  .append('svg')
  .attr('preserveAspectRatio', 'xMinYMin meet')
  .attr('viewBox', '0 0 600 400')
  .attr('height', height + margin.top + margin.bottom)
  .classed('svg-content-responsive', true)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

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

  var districtList = Object.keys(parsedData);
  var graph_selected_district = 'Total',
    totaldata,
    graph_selected_feature = 'active';

  // create a static tooltip
  var Tooltip = d3.select('#graph')
    .append('div')
    .attr('class', 'tooltip')
    .style('display', 'inline')
    .style('left', '80px')
    .style('top', '10px')
    .style('position', 'absolute')
    .style('background-color', 'white')
    .style('z-index', '-1000')
    .style('border', 'solid')
    .style('border-width', '2px')
    .style('border-radius', '5px')
    .style('padding', '8px')
    .style('margin', '5px')
    .style('font-size', '12px')
    .style('text-align', 'left')
    .html('Click on a data point');

  var tooltipClick = function(d) {
    var date = d['date'];
    var dateStr = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear();
    Tooltip
      .html(
        '<b>' + dateStr + '</b><br/>' +
        graphFeatureMap[graph_selected_feature] + ': <b>' + d[graph_selected_feature] + '</b><br/>'
      );
  }

  function drawGraph() {
    totaldata = parsedData[graph_selected_district].sort(function(a, b) {
      return d3.ascending(a.date, b.date);
    });
    width = Math.min(parseInt(d3.select('body').style('width'), 10), 600) - margin.left - margin.right - 10;
    // take care of gmin == gmax issues
    var graph_min = d3.min(totaldata, function(d) {
        return d[graph_selected_feature];
      }),
      graph_max = d3.max(totaldata, function(d) {
        return d[graph_selected_feature];
      });
    if (graph_max <= 0) {
      graph_max = 50;
    }
    if (graph_max === graph_min) {
      graph_min = 0;
    }

    // #TODO move them outside and figure out d3's enter update exit loop
    var xScale = d3.scaleTime()
      .domain(d3.extent(totaldata, function(d) {
        return d.date;
      }))
      .range([0, width]);

    var xAxis = svg.append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(xScale));

    // Y scaling function
    var yScale = d3.scaleLinear()
      .domain([graph_min, graph_max])
      .range([height, 0]);
    var yAxis = svg.append('g')
      .call(d3.axisLeft(yScale));
    // set the width
    svg.attr('width', width + margin.left + margin.right);
    // resized scale
    // set tooltip position
    if (width < 400) {
      Tooltip
        .style('left', '40px')
        .style('top', '10px')
        .style('font-size', '9px')
    }
    // Add the curve
    svg.append('path')
      .datum(totaldata)
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('stroke-width', 1.5)
      .attr('d', d3.line()
        .curve(d3.curveCatmullRom)
        .x(function(d) {
          return xScale(d.date)
        })
        .y(function(d) {
          return yScale(d[graph_selected_feature])
        })
      )

    // Add the points
    svg
      .append('g')
      .selectAll('dot')
      .data(totaldata)
      .enter()
      .append('circle')
      .attr('class', 'myCircle')
      .attr('cx', function(d) {
        return xScale(d.date)
      })
      .attr('cy', function(d) {
        return yScale(d[graph_selected_feature])
      })
      .attr('r', 8)
      .attr('stroke', '#000')
      .attr('stroke-width', 3)
      .attr('fill', '#feb24c')
      .on('click', tooltipClick)
  }
  var districtSelect = d3.select('#districtSelect');
  var districtOpts = districtSelect.selectAll(null)
    .data(districtList)
    .enter()
    .append('option')
    .attr('value', function(d) {
      return d;
    })
    .text(function(d) {
      return d;
    });
  districtSelect.property('value', graph_selected_district);
  districtSelect.on('change', districtChangeListener);
  var graphFeatureSelect = d3.select('#graphFeatureSelect');
  graphFeatureSelect.property('value', graph_selected_feature);
  graphFeatureSelect.on('change', graphFeatureChangeListener);

  function updateGraph() {
    svg.selectAll('*').remove();
    drawGraph();
  }

  function districtChangeListener() {
    if (this.selectedOptions.length > 0) {
      var selOpt = this.selectedOptions[0].value;
      graph_selected_district = selOpt;
    }
    updateGraph();
  }

  function graphFeatureChangeListener() {
    if (this.selectedOptions.length > 0) {
      var selOpt = this.selectedOptions[0].value;
      graph_selected_feature = selOpt;
    }
    updateGraph();
  }

  drawGraph();
});

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

// helper to get latest date from array
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


// load data
var data = {},
  selected_date = '',
  selected_feature = 'active';

var dates = [],
  dateSelect = d3.select('#dateSelect');
Object.keys(dataIndex.daily_bulletin).forEach(function(key) {
  dates.push(key);
  selected_date = key;
});
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
  if (selected_date !== undefined) {
    infobar.html('<p class="subtitle is-5">People with COVID-19 in Kerala: <b>' +
      dataIndex.daily_bulletin[selected_date]['total_active'] +
      '</b>  Deaths: <b>' + dataIndex.daily_bulletin[selected_date]['deaths'] +  '</b></p>' +
      '<p class="subtitle is-6"> Samples sent: <b>' + dataIndex.daily_bulletin[selected_date]['sample_sent'] +
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

// tab switching code
var tabs = d3.selectAll('#tabs li');
tabs.on('click', function() {
  var self = d3.select(this);
  var tabNum = self.attr('data-tab');
  tabs.classed('is-active', false);
  self.classed('is-active', true);

  d3.selectAll('#tab-container section').classed('is-active', false);
  d3.selectAll('#tab-container section[data-content="' + tabNum + '"]').classed('is-active', true);
});
