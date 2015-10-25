// Highcharts Gauge Options
var gaugeOptions = {
  chart: {
    type: 'solidgauge'
  },
  title: null,
  pane: {
    center: ['50%', '85%'],
    size: '140%',
    startAngle: -90,
    endAngle: 90,
    background: {
      backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || '#EEE',
      innerRadius: '60%',
      outerRadius: '100%',
      shape: 'arc'
    }
  },
  tooltip: {
    enabled: false
  },
  credits: {
    enabled: false
  },
  yAxis: {
    min: 0,
    max: 100,
    stops: [
      [0.1, '#DF5353'], // red
      [0.3, '#DDDF0D'], // yellow
      [0.9, '#41c17d'] // green
    ],
    lineWidth: 0,
    minorTickInterval: null,
    tickPixelInterval: 400,
    tickWidth: 0,
    title: {
      style: {
        "color": "#6d6c6c"
      }
    },
    labels: {
      enabled: false
    }
  },
  plotOptions: {
    solidgauge: {
      dataLabels: {
        y: 5,
        borderWidth: 0,
        useHTML: true
      }
    }
  }
};

var tempChartOptions = {
  chart: {
    type: 'spline'
  },
  title: {
    text: '',
    style: {
      display: 'none'
    }
  },
  subtitle: {
    text: '',
    style: {
      display: 'none'
    }
  },
  legend: {
    enabled: false
  },
  credits: {
    enabled: false
  },
  xAxis: {
    type: 'datetime'
  },
  yAxis: {
    title: {
      enabled: false
    },
    labels: {
      format: '{value}°C'
    }
  },
  tooltip: {
    crosshairs: true,
    valueSuffix: '°C',
    valueDecimals: 1,
    xDateFormat: '%d. %b %H:%M'
  },
  plotOptions: {
    spline: {
      marker: {
        radius: 4,
        lineColor: '#666666',
        lineWidth: 1
      }
    }
  }
};

var soilChartOptions = {
  chart: {
    type: 'spline'
  },
  title: {
    text: 'Soil Moisture',
    style: {
      "color": "#525252"
    }
  },
  subtitle: {
    text: '',
    style: {
      display: 'none'
    }
  },
  credits: {
    enabled: false
  },
  xAxis: {
    type: 'datetime'
  },
  yAxis: {
    title: {
      enabled: false
    },
    labels: {
      format: '{value}%'
    }

  },
  tooltip: {
    crosshairs: true,
    valueDecimals: 1,
    valueSuffix: '%',
    xDateFormat: '%d. %b %H:%M',
    shared: true
  },
  plotOptions: {
    spline: {
      marker: {
        radius: 4,
        lineColor: '#666666',
        lineWidth: 1
      }
    }
  }
};

// render gauge chart
function renderGauge(objectId, value, title, titlepos) {
  $('#container-' + objectId).highcharts(Highcharts.merge(gaugeOptions, {
    yAxis: {
      title: {
        text: title,
        y: titlepos
      }
    },
    series: [{
      name: title,
      data: [value / 4096 * 100],
      dataLabels: {
        format: '{y:.0f}%'
      }
    }]
  }));
};

// render temperature chart
function renderChart(data, divId, config) {
  $(divId).highcharts(Highcharts.merge(config, {
    series: data
  }));
}

// get 24 hour history data for main view and table from parse.com
function get24HourData() {
  var outputMain = $("#main-data");
  var sourceMain = $("#main-data-template").html();
  var templateMain = Handlebars.compile(sourceMain);

  var PlantStatus = Parse.Object.extend("Status");
  var query = new Parse.Query(PlantStatus);
  query.limit(24); // get the values of the last 24 hours - TODO depending on status this could be more than 24 values, use query filter
  query.descending("createdAt");
  query.find({
    success: function(results) {
      if (results.length > 0) {
        var object = results[0];
        object.set("temperature", parseFloat(object.get("temperature")));
        object.set("humidity", parseFloat(object.get("humidity")));
        object.set("pressure", parseFloat(object.get("pressure")));
        var html = templateMain(object.toJSON());
        outputMain.append(html);
        renderGauge("soil1-main", object.get("soil1"), "Plant 1", -25);
        renderGauge("soil2-main", object.get("soil2"), "Plant 2", -25);
        renderGauge("soil3-main", object.get("soil3"), "Plant 3", -25);
      }

      var tempSeries = [];
      var tempDataPoint = {
        name: "Temp",
        data: [],
        pointInterval: 3600 * 1000
      };
      var soilSeries = [];
      var soil1DataPoint = {
        name: "Plant 1",
        data: [],
        pointInterval: 3600 * 1000
      };
      var soil2DataPoint = {
        name: "Plant 2",
        data: [],
        pointInterval: 3600 * 1000
      };
      var soil3DataPoint = {
        name: "Plant 3",
        data: [],
        pointInterval: 3600 * 1000
      };
      for (var i = 0; i < results.length; i++) {
        var object = results[i];
        tempDataPoint.data.push([object.createdAt.valueOf(), parseFloat(object.get("temperature"))]);
        soil1DataPoint.data.push([object.createdAt.valueOf(), parseInt(object.get("soil1")) / 4096 * 100]);
        soil2DataPoint.data.push([object.createdAt.valueOf(), parseInt(object.get("soil2")) / 4096 * 100]);
        soil3DataPoint.data.push([object.createdAt.valueOf(), parseInt(object.get("soil3")) / 4096 * 100]);
      }
      tempSeries.push(tempDataPoint);
      var config = tempChartOptions;
      config.title.text = "Temperature";
      config.title.style = {
        "color": "#525252"
      };
      renderChart(tempSeries, "#24hour-temp-data", config);
      soilSeries.push(soil1DataPoint);
      soilSeries.push(soil2DataPoint);
      soilSeries.push(soil3DataPoint);
      renderChart(soilSeries, "#24hour-soil-data", soilChartOptions);

    },
    error: function(error) {
      alert("Error: " + error.code + " " + error.message);
    }
  });
}

// get daily temperature history data
function getDailyTemperatureData() {
  var PlantStatus = Parse.Object.extend("Status");
  var query = new Parse.Query(PlantStatus);
  query.descending("createdAt");
  query.exists("daily");
  query.find({
    success: function(results) {
      var seriesArr = [];
      var series = {
        name: "Temp",
        data: [],
        pointInterval: 24 * 3600 * 1000
      };
      for (var i = 0; i < results.length; i++) {
        var object = results[i];
        series.data.push([object.createdAt.valueOf(), parseFloat(object.get("temperature"))]);
      }
      seriesArr.push(series);
      renderChart(seriesArr, "#history-temp-data", tempChartOptions);
    },
    error: function(error) {
      alert("Error: " + error.code + " " + error.message);
    }
  });
}
