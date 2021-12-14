
(function() {

  const TEXTS_URL = "https://x-transform-backend.kontrollfeld.net/basic-texts";
  const DATES_URL = "https://x-transform-backend.kontrollfeld.net/dates";
  const DATES_PAST_URL = "https://x-transform-backend.kontrollfeld.net/dates-past";
  const DOWNLOADS_URL = "https://x-transform-backend.kontrollfeld.net/downloads";

  const PAGES = ["images", "downloads", "news", "social"];

  var cars2soccer = function(cars) {
    return Math.floor(cars * PARKING_SIZE / SOCCER_FIELD_SIZE * 10)/10;
  };

  var formatNumber = function(f) {
    var s = "" + f;
    var split = s.split(".");
    var n = "";
    for( var i = split[0].length ; i >= 0 ; i -= 3 ) {
      if( i <= 3 ) {
        n = split[0].substring( 0, i ) + n;
      } else {
        n = "." + split[0].substring( i-3, i ) + n; 
      }
      //console.log(n);
    }
    if( split.length > 1 ) {
      return n + "," + split[1];
    }
    return n;
  };

  var _carCounts = {};

  var frohnauSVG = {
    x: 374.14599609375,
    y: 184.19900512695312,
  };
  var frohnauGPS = {
    x: 13.26235,
    y: 52.64047,
  };

  var gruenauSVG = {
    x: 933.7319946289062,
    y: 856.6640014648438,
  };
  var gruenauGPS = {
    x: 13.55454,
    y: 52.42569,
  };

  var svg2gps = function(svg) {
    var scaleX = (gruenauGPS.x - frohnauGPS.x) / (gruenauSVG.x - frohnauSVG.x);
    var scaleY = (gruenauGPS.y - frohnauGPS.y) / (gruenauSVG.y - frohnauSVG.y);
    return {
      x: frohnauGPS.x + (svg.x - frohnauSVG.x) * scaleX,
      y: frohnauGPS.y+ (svg.y - frohnauSVG.y) * scaleY,
    }
  }

  function scrollToTargetAdjusted(targetId){
      var element = document.getElementById(targetId);
      element.scrollIntoView();
      return;

      var headerOffset = 0;
      var elementPosition = element.getBoundingClientRect().top;
      var offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
           top: offsetPosition,
           behavior: "smooth"
      });
  }

  var d3Map = d3.select("#berlin-map");
  var districtTooltip = d3Map
    .append("div")
      .style("border-radius", "2em")
      .style("border", "1px solid #666")
      .style("z-index", "5")
      //.style("width", "500px")
      .style("margin", "1em")
      .style("padding", "1em")
      .style("background-color", "white")
      .style("filter", "drop-shadow(0px 0px 0.5em #999)")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .text("");

  var circleTooltip = d3Map
    .append("div")
      .attr("id", "circle-popup")
      .text("");

  /////////////////////////////////////////

  var mouseX;
  var mouseY;
  document.addEventListener("mousemove", function(e) {
     mouseX = e.offsetX;
     mouseY = e.offsetY;
  });

  var stats = {};
  var district2dates = {};

  const PARKING_SIZE = 15;
  const TEMPELHOFER_FELD_SIZE = 3000000;
  const SOCCER_FIELD_SIZE = 7140;;

  var generateStats = function(size) {
    return {
      parking: Math.round(Math.random()*size/4),
      roadsCounted: Math.round(Math.random()*size/40),
    };
  }

  var initMap = function() {
    d3.xml("img/berlin-map.svg").then(data => {
      var domMap = d3.select("#berlin-map");
      //console.log("data", data.documentElement);
      domMap.node().append(data.documentElement);


      var map = d3.select("#berlin-map svg");

      var getDistrictColor = function(d) {
        if( d["field_neighbourhood"] && d["field_neighbourhood"].length && d["field_neighbourhood"][0]["value"] ) {
          var district = d["field_neighbourhood"][0]["value"];
          for( var i in district2dates[district] ) {
            if( district2dates[district][i].isUpcomingEvent ) {
              return 'red';
            }
          }
        }
        return '#666';
      };

      var getDistrictPos = function(d) {
        var dname = null;
        if( typeof d === "string" ) {
          dname = d;

        } else if( d["field_neighbourhood"] && d["field_neighbourhood"].length && d["field_neighbourhood"][0]["value"] ) {
          dname = d["field_neighbourhood"][0]["value"];

        } else {
          return null;
        }
          
        if( district2center[dname] ) {
          //var d = district2center[d["field_neighbourhood"][0]["value"]];
          //return {x: d.cx, y: d.cy};
          var bbox = district2bbox[dname];
          return {
            x: bbox.x - bbox.width / 2,
            y: bbox.y - bbox.height / 2,
          };
        }
        return null;
      };

      var district2center = {};
      map.selectAll("polygon").each( function(d, i) {
        var district = this.id;
        //console.log(district, this.points.length);
        if( !district2center[district] ) {
          district2center[district] = {
            n: 0,
            x: 0,
            y: 0,
            cx: 0,
            cy: 0,
          };
        }
        for( var j = 0 ; j < this.points.length ; j++ ) {
          var p = this.points[j];
          if( p.x > 0 && p.y > 0 ) {
            //console.log(district, p.x, p.y);
            district2center[district].x += p.x;
            district2center[district].y += p.y;
            district2center[district].cx = district2center[district].x / this.points.length;
            district2center[district].cy = district2center[district].y / this.points.length;
          }
        }
      });


      var district2bbox = {};
      map.selectAll('polygon').each( function(d, i) {
        var district = this.id;

        //var bbox = ev.toElement.getBBox();
        var bbox = this.getBBox();
        district2bbox[district] = bbox;

        var district = this.id;
        var size = bbox.width * bbox.height;
        if( !stats[district] ) {
          stats[district] = generateStats(size);
        }
        //var r = 192 + Math.round(Math.random() * 64);
        //d3.select(this).style('fill', "rgba(" + r + "," + r + "," + r + ",1)");
        d3.select(this).style('fill', "#eee");
      });


      //var mitteBBox = district2bbox["Mitte"];
      //var mitteLoc = district2center["Mitte"];
      var mitte = getDistrictPos( "Mitte" );
      if( mitte ) {
        map.append("svg:image")
          //.attr('x', mitteLoc.cx)
          //.attr('y', mitteLoc.cy)
          .attr('x', mitte.x)
          .attr('y', mitte.y-10)
          .attr('width', 60)
          .attr('height', 60)
          .attr("xlink:href", "img/fernsehturm.png");
      }

      var popupLocked = false;

      map.selectAll('polygon')
        //.style('fill', "white")
        .on("mouseover", function(ev) {
          var district = ev.toElement ? ev.toElement.id : ev.target.id;

          var carCount = _carCounts[district];
          if( !(carCount >= 0) ) {

            var points = [];
            var allPoints = [];
            var skipped = 0;
            for( var i = 0 ; i < this.points.length ; i++ ) {
              var cur = svg2gps(this.points[i]);
              var skip = false;
              if( i > 0 && i < this.points.length - 1 ) {
                var prev = svg2gps(this.points[i-1]);
                var next = svg2gps(this.points[i+1]);

                var lineLength = Math.sqrt( Math.pow( next.x - prev.x, 2 ) + Math.pow( next.y - prev.y, 2 ) );

                var curDistToLine = Math.abs( (next.x - prev.x) * (prev.y - cur.y) - (prev.x - cur.x) * (next.y - prev.y) ) / lineLength;
                //console.log((curDistToLine / lineLength), curDistToLine , lineLength);
                if( (curDistToLine / lineLength) < 0.05 ) {
                  skip = true;
                }
              }

              if( !skip ) {
                points.push( "" + cur.x + "," + cur.y );
              } else {
                skipped ++;
              }
              allPoints.push( "" + cur.x + "," + cur.y );
              //console.log("points", points);
              //console.log("allPoints", allPoints);
            }
            //console.log("skipped " + skipped + " points out of " + this.points.length );
            if( points.length > 0 ) {
              points.push( points[0] );

              var xhrData = new XMLHttpRequest();
              xhrData.onload = function () {
                if (xhrData.status >= 200 && xhrData.status < 300) {
                  try {
                    var carCount = 0;
                    var o = JSON.parse(xhrData.response);
                    for( var i = 0 ; i < o['features'].length ; i ++ ) {
                      var f = o['features'][i];
                      if( f['properties'] && f['properties']['subsegments'] && f['properties']['subsegments'].length > 0 ) {
                        for( var j = 0 ; j < f['properties']['subsegments'].length ; j++ ) {
                          var s = f['properties']['subsegments'][j];
                          if( s.car_count > 0 ) {
                            carCount += s.car_count;
                          }
                        }
                      }
                    }
                    //console.log("car count for " + district + ": " + carCount)
                    _carCounts[district] = carCount;
                    var o = document.getElementById('number-of-cars-' + district);
                    if( o ) {
                      o.innerHTML = formatNumber(carCount); 
                      document.getElementById('cars-to-soccer-' + district).innerHTML = formatNumber(cars2soccer(_carCounts[district]));
                    }

                  } catch(e) {
                    console.log("failed to parse response: " + e);
                    //throw(e);
                  }
                }
              };
              var url = 'https://api.xtransform.org/segments?bbox=' + points.join(",");
              //console.log("url", url);
              xhrData.open('GET', url, true);
              xhrData.setRequestHeader('Content-Type', 'application/json' );
              xhrData.send(null);
            }
          }

          var bbox = ev.toElement ? ev.toElement.getBBox() : ev.target.getBBox();
          var size = bbox.width * bbox.height;
          //d3.select(this).style("fill", d3.select(this).attr('stroke')).attr('fill-opacity', 0.3);
          d3.select(this).attr('fill-opacity', 0.3);
          if( !stats[district] ) {
            stats[district] = generateStats(size);
          }

          districtTooltip.style("visibility", "visible");
          districtTooltip.html("");

          var s = stats[district];
          districtTooltip.append("div").html(
            "<span style='font-size: 1.5em; font-weight: bold;'>" + district.replace("_", " ") + "</span>" + 
            "<br>" +
            "<br>Bisher haben wir hier<br><span id='number-of-cars-" + district + "' style='font-size: 1.5em; font-weight: bold; font: monospace;'>" + (_carCounts[district] >= 0 ? formatNumber(_carCounts[district]) : "...") + "</span> <br>Parkpl&auml;tze gez&auml;hlt!" +
            "<br>" +
            "<br>Das entspricht etwa <br><span id='cars-to-soccer-" + district + "' style='font-size: 1.5em; font-weight: bold; font: monospace;'>" + (_carCounts[district] >= 0 ? formatNumber(cars2soccer(_carCounts[district])) : "..." ) + "</span> <br>Fu&szlig;ballfeldern." +
            ""
            //"<br>Bisher haben wir <b>" + s.parking + "</b> Parkpl&auml;tze gez&auml;hlt!" +
            //"<br>Das entspricht etwa <b>" + Math.ceil(s.parking * PARKING_SIZE / SOCCER_FIELD_SIZE * 10)/10 + "</b> Fu&szlig;ballfeldern." +
            //"<br>Wir haben bereits <b>" + s.roadsCounted + "</b> Stra&szlig;en besucht"
            );
        })
        .on("click", function(ev) {
          
          //circleTooltip.style("visibility", "hidden");
        })
        .on("mousemove", function(ev) {
          districtTooltip.style("top", (ev.offsetY)+"px").style("left",(ev.offsetX)+"px");
        })
        .on("mouseout", function(ev) {
          //d3.select(this).style("fill", "white").attr('fill-opacity', 1);
          if( !popupLocked ) {
            districtTooltip.style("visibility", "hidden");
          }
          d3.select(this).attr('fill-opacity', 1);
        });

      /////////////////////////////////

      var renderDates = function() {
        var allDates = [];
        var districts = Object.keys(district2dates);
        for( var k in districts ) {
          for( var v in district2dates[districts[k]] ) {
            allDates.push( district2dates[districts[k]][v] );
          }
        }

        map
          .selectAll('circle')
          .data(allDates)
          .join('circle')
          .attr('cx', d => getDistrictPos(d) ? getDistrictPos(d).x-32 : null)
          .attr('cy', d => getDistrictPos(d) ? getDistrictPos(d).y-32 : null)
          .attr('r', 8)
          .attr("fill-opacity", 0.8)
          .attr("fill", d => getDistrictColor(d))
          .style("background-color", d => getDistrictColor(d))
          .attr('id', d => "past-date-" + d["field_neighbourhood"].length ? d["field_neighbourhood"][0]["value"] : "xxx" )
          .on("click", function(ev, d) {
            popupLocked = !popupLocked;
            //circleTooltip.style("visibility", "hidden");
          })
          .on("mouseover", function(ev, d) {

            circleTooltip.style("visibility", "visible");
            circleTooltip.html("");
            //console.log("ev", ev, d);

            var district = ev.toElement ? ev.toElement.id : ev.target.id;
            var areaDates = district2dates[district];
            areaDates.sort((a, b) => (a["field_date"][0]["value"] < b["field_date"][0]["value"]) ? 1 : -1);

            var i = 0;
            areaDates.forEach( function(date) {
              if( i > 0 && i < areaDates.length ) {
                circleTooltip.append("hr").style("margin-top", "2em").style("margin-bottom", "2em");
              }
              circleTooltip.append("div").style("position", "absolute").style("cursor", "pointer").style("top", "1em").style("right", "1em").html("X").on("click", function(ev, d) { 
                popupLocked = false;
                circleTooltip.style("visibility", "hidden");
              } );
              circleTooltip.append("div").style("z-index", 5).html(
                "<h2 style=''>" + date["title"][0]["value"] +  "</h2>" + 
                "<h4 style=''>" + date["field_date"][0]["value"] + " - " + date["field_time"][0]["value"] + "</h4>" + 
                "<p style='line-height: 1.5em;'>" + (date["field_location"] && date['field_location'].length > 0 ? date["field_location"][0]["value"] + " - " : "") + (date["field_location_street_and_number"] && date["field_location_street_and_number"].length ? date["field_location_street_and_number"][0]["value"] : "" ) + "</p>" +
                "<div>" + date["body"][0]["processed"] + "</div>"
              );
              i += 1;
            });
          })
          .on("mousemove", function(ev) {
            circleTooltip.style("top", (ev.offsetY-300)+"px").style("left",(ev.offsetX+10)+"px");
          })
          .on("mouseout", function(ev) {
            //d3.select(this).attr('fill-opacity', 0.5);
            var district = ev.toElement ? ev.toElement.id : ev.target.id;
            if( !popupLocked ) {
              circleTooltip.style("visibility", "hidden");
            }
            //circleTooltip.style("visibility", "hidden");
          });
      }

      /////////////////////////////////

      var pastDatesLoaded = false;
      var upcomingDatesLoaded = false;
      var formatDate = function(d) {
        var months = {
          1: "Januar",
          2: "Februar",
          3: "März",
          4: "April",
          5: "Mai",
          6: "Juni",
          7: "Juli",
          8: "August",
          9: "September",
          10: "Oktober",
          11: "November",
          12: "Dezember",
        };
        if( !d ) { return ""; }
        var split = d.split("-");
        if( split.length == 3 ) {
          return split[2] + ". " + months[parseInt(split[1])] + " " + split[0];
        }
        return d;
      }

      var xhrDates = new XMLHttpRequest();
      xhrDates.onload = function () {
        if (xhrDates.status >= 200 && xhrDates.status < 300) {

          var dates = JSON.parse(xhrDates.response);

          for( var i = 0 ; i < dates.length ; i++ ) {
            var date = dates[i];
            date.isUpcomingEvent = true;
            date.isPastEvent = false;
            if( date && date["field_neighbourhood"] && date["field_neighbourhood"].length && date["field_neighbourhood"][0]["value"] ) {
              var n = date["field_neighbourhood"][0]["value"];
              if( !district2dates[n] ) { district2dates[n] = []; }
              district2dates[n].push( date );
            }
          }

          //console.log('dates', dates);

          var upcomingEvents = document.getElementById("upcoming-events");
          upcomingEvents.innerHTML = "";
          if( dates.length == 0 ) {
            upcomingEvents.innerHTML = "Momentan keine kommenden Veranstaltungen - schau in ein paar Tagen nochmal rein!";
          }
          var i = 0;
          dates.forEach( function(date) {
            if( i > 0 && i < dates.length ) {
              var hr = document.createElement("hr");
              hr.style.cssText = 'margin-top: 2em; margin-bottom: 2em;';
              upcomingEvents.appendChild(hr);
            }
            var o = document.createElement("div");
            //console.log('date', date);
            o.innerHTML =
              "<h3>" + date["title"][0]["value"] +  "</h3>" + 
              "<h4>" + formatDate(date["field_date"][0]["value"]) + " " + date["field_time"][0]["value"] + "</h4>" + 
              "<p>" + (date["field_location"] && date['field_location'].length > 0 ? date["field_location"][0]["value"] + " - " : "") + (date["field_location_street_and_number"] && date["field_location_street_and_number"].length ? date["field_location_street_and_number"][0]["value"] : "" ) +  "</p>" + 
              "<div>" + date["body"][0]["processed"] + "</div>";

            upcomingEvents.appendChild(o);
            i += 1;
          });

          if( pastDatesLoaded ) {
            renderDates();
          }
          upcomingDatesLoaded = true;
        }
      };
      xhrDates.open('GET', DATES_URL, true);
      xhrDates.send('');

      ///////////////////////////////////////

      var xhrPastDates = new XMLHttpRequest();
      xhrPastDates.onload = function () {
        if (xhrPastDates.status >= 200 && xhrPastDates.status < 300) {

          var dates = JSON.parse(xhrPastDates.response);
          for( var i = 0 ; i < dates.length ; i++ ) {
            var date = dates[i];
            date.isUpcomingEvent = false;
            date.isPastEvent = true;
            if( date && date["field_neighbourhood"] && date["field_neighbourhood"].length && date["field_neighbourhood"][0]["value"] ) {
              var n = date["field_neighbourhood"][0]["value"];
              if( !district2dates[n] ) { district2dates[n] = []; }
              district2dates[n].push( date );
            }
          }

          var pastEvents = document.getElementById("past-events");
          pastEvents.innerHTML = "";
          var i = 0;
          dates.forEach( function(date) {
            if( i > 0 && i < dates.length ) {
              var hr = document.createElement("hr");
              hr.style.cssText = 'margin-top: 2em; margin-bottom: 2em;';
              pastEvents.appendChild(hr);
            }
            var o = document.createElement("div");
            //console.log('date', date);
            o.innerHTML =
              "<h3>" + date["title"][0]["value"] +  "</h3>" + 
              "<h4>" + date["field_date"][0]["value"] + " - " + date["field_time"][0]["value"] + "</h4>" + (date["field_location"] && date['field_location'].length > 0 ? date["field_location"][0]["value"] + " - " : "") + (date["field_location_street_and_number"] && date["field_location_street_and_number"].length ? date["field_location_street_and_number"][0]["value"] : "" ) +
              date["body"][0]["processed"];

            pastEvents.appendChild(o);
            i += 1;
          });

          if( upcomingDatesLoaded ) {
            renderDates();
          }
          pastDatesLoaded = true;
        }
      };
      xhrPastDates.open('GET', DATES_PAST_URL, true);
      xhrPastDates.send('');
    });
  };

  var initDownloads = function() {

    var xhrDownloads = new XMLHttpRequest();
    xhrDownloads.onload = function () {
      if (xhrDownloads.status >= 200 && xhrDownloads.status < 300) {
        var downloads = JSON.parse(xhrDownloads.response);
        var downloadsEl = document.getElementById("downloads");
        downloadsEl.innerHTML = "";
        var i = 0;
        downloads.forEach( function(dl) {
          if( i >= 0 && i < downloads.length ) {
            downloadsEl.appendChild(document.createElement("br"));
          }
          var o = document.createElement("div");
          o.innerHTML = "<a href='" + dl["field_pdf"][0]["url"] + "'>" + dl["title"][0]["value"] + "</a>";
          downloadsEl.appendChild(o);
          i += 1;
        });

      }
    };
    xhrDownloads.open('GET', DOWNLOADS_URL, true);
    xhrDownloads.send('');
  };

  var initTexts = function() {

    var xhrTexts = new XMLHttpRequest();
    xhrTexts.onload = function () {
      if (xhrTexts.status >= 200 && xhrTexts.status < 300) {
        var texts = JSON.parse(xhrTexts.response);
        for( var i = 0 ; i < texts.length ; i++ ) {
          var txt = texts[i];
          var id = txt["title"].toLowerCase().replaceAll(" ", "-");
          var o = document.getElementById( "basic-text-" + id );
          if( o ) {
            var div = document.createElement("div");
            var html = txt["text"];
            if( id == "about-us" ) {
              html = '<div class="max-shadow"><span>&#x25bc;</span></div>' + html;
            }
            div.innerHTML = html;
            o.appendChild( div );
          } else {
            console.warn("Couldn't find basic text field " + id);
          }
        }
        document.getElementById("body").style.opacity = "1";
        document.getElementById("container").style.opacity = "1";
      }
    };
    xhrTexts.open('GET', TEXTS_URL, true);
    xhrTexts.send('');
  };

  var init = function() {
    PAGES.forEach( function(p, i) {
      document.getElementById("menu-" + p).addEventListener('click', function(ev) {
        scrollToTargetAdjusted("target-" + p);
      });
    });

    initDownloads();
    initMap();
    initSlideShow();
    initTexts();

    window.onscroll = function(ev) {
      /*
      var B = document.body; //IE 'quirks'
      var D = document.documentElement; //IE with doctype
      D = (D.clientHeight)? D: B;

      console.log(D.scrollTop);
      if (D.scrollTop < 100) {
        document.getElementById("header").style.height = "5em";
      } else {
        document.getElementById("header").style.height = "2em";
      }
      */
    };

  };

  init();

})();
