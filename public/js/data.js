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
function tempChart(data) {
  $('#history-data').highcharts({
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
    xAxis: {
      type: 'datetime',
      labels: {
        formatter: function() {
          var myDate = new Date(this.value);
          var newDateMs = Date.UTC(myDate.getUTCFullYear(), myDate.getUTCMonth() - 1, myDate.getUTCDate());
          return Highcharts.dateFormat('%e. %b', newDateMs);
        }
      }
    },
    tooltip: {
      headerFormat: '',
      valueSuffix: '°',
      valueDecimals: 1
    },
    legend: {
      enabled: false
    },
    credits: {
      enabled: false
    },
    yAxis: {
      title: {
        enabled: false
      },
      labels: {
        formatter: function() {
          return this.value + '°';
        }
      }
    },
    plotOptions: {
      spline: {
        marker: {
          radius: 4,
          lineColor: '#666666',
          lineWidth: 1
        }
      }
    },
    series: data
  });
}

// table helper to attach drop down switch column
function attachTabeColumn(output) {
  var table = output.parent();
  table.children('thead').children('tr').append('<th></th>');
  table.children('tbody').children('tr').filter(':odd').hide();
  table.children('tbody').children('tr').filter(':even').click(function() {
    var element = $(this);
    element.next('tr').toggle('slow');
    element.find(".table-expandable-arrow").toggleClass("up");
  });
  table.children('tbody').children('tr').filter(':even').each(function() {
    var element = $(this);
    element.append('<td><div class="table-expandable-arrow"></div></td>');
  });
}

// get 24 hour history data for main view and table from parse.com
function get24HourData() {
  var outputMain = $("#main-data");
  var sourceMain = $("#main-data-template").html();
  var templateMain = Handlebars.compile(sourceMain);

  var output = $("#output");
  var source = $("#24hourtabletemplate").html();
  var template = Handlebars.compile(source);

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

      for (var i = 0; i < results.length; i++) {
        var object = results[i];
        // convert numbers from string to float
        object.set("temperature", parseFloat(object.get("temperature")));
        object.set("humidity", parseFloat(object.get("humidity")));
        object.set("pressure", parseFloat(object.get("pressure")));

        var html = template(object.toJSON());
        output.append(html);

        renderGauge("soil1-" + object.id, object.get("soil1"), "Plant 1", -22);
        renderGauge("soil2-" + object.id, object.get("soil2"), "Plant 2", -22);
        renderGauge("soil3-" + object.id, object.get("soil3"), "Plant 3", -22);
      }
      attachTabeColumn(output);
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
      tempChart(seriesArr);
    },
    error: function(error) {
      alert("Error: " + error.code + " " + error.message);
    }
  });
}
