
(function() {

  const DATA_URL = "data-new/";
  const TEXTS_URL = DATA_URL + "basic-texts.json";
  const DATES_URL = DATA_URL + "dates.json";
  const DOWNLOADS_URL = DATA_URL + "downloads.json";

  const PAGES = ["downloads", "news", "media", "results", "example"];

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

      var formatDateBody = function(s) {
      const regex = /[*]{10,}/g;
      var newS = s.replaceAll(regex, '<hr>');
          //console.log(s);
          //console.log(newS);
      return newS;
        };

      var district2dates = {};
      var buildMap = function() {
      var d3Map = d3.select("#berlin-map");
      if( !d3Map ) { return false; }

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

      const PARKING_SIZE = 15;
      const TEMPELHOFER_FELD_SIZE = 3000000;
      const SOCCER_FIELD_SIZE = 7140;;

      var generateStats = function(size) {
        return {
          parking: Math.round(Math.random()*size/4),
          roadsCounted: Math.round(Math.random()*size/40),
        };
      }

      return true;
  };

  var initMap = function() {
    d3.xml("img/berlin-map.svg").then(data => {
      var domMap = d3.select("#berlin-map");
      if( !domMap || !domMap.node() ) { return; }
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
              xhrData.onerror = function (e) {
              console.log("error", e);
              var o = document.getElementById('cars-to-soccer-' + district);
                      if( o ) { o.innerHTML = "?"; }
                      o = document.getElementById('number-of-cars-' + district);
                      if( o ) { o.innerHTML = "?"; }
              };
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

      var pastDatesLoaded = false;
      var upcomingDatesLoaded = false;
      var xhrDates = new XMLHttpRequest();
      xhrDates.onload = function () {
        if (xhrDates.status >= 200 && xhrDates.status < 300) {

          var dates = JSON.parse(xhrDates.response);
          var upcomingEvents = [];

          for( var i = 0 ; i < dates.length ; i++ ) {
            var date = dates[i];

            date.isUpcomingEvent = (new Date(date["date"])).getTime() + (24*60*60*1000000) >= Date.now();
            if( date && date["location"] ) {
              var n = date["location"];
              if( !district2dates[n] ) { district2dates[n] = []; }
              district2dates[n].push( date );
            }
            if( date.isUpcomingEvent ) {
              upcomingEvents.add( date );
            }
          }

          //console.log('dates', dates);

          var upcomingEventsEl = document.getElementById("upcoming-events");
          upcomingEventsEl.innerHTML = "";
          if( upcomingEvents.length == 0 ) {
            //upcomingEventsEl.innerHTML = "Momentan keine kommenden Veranstaltungen - schau in ein paar Tagen nochmal rein!";
            upcomingEventsEl.innerHTML =
              "<div style='border-radius: 2em; padding: 1em; background-color: #ddd;'>" + 
              "<h3>Momentan keine geplanten Veranstaltungen</h3><h5>Schau in ein paar Tagen nochmal vorbei!</h5>";
          }
          for( var i = 0 ; i < upcomingEvents.length ; i++ ) {
            if( i > 0 && i < upcomingEvents.length ) {
              var hr = document.createElement("div");
              hr.style.cssText = 'margin-top: 2em; margin-bottom: 2em;';
              upcomingEventsEl.appendChild(hr);
            }
            var o = document.createElement("div");
            o.innerHTML =
            "<div style='border-radius: 2em; padding: 1em; background-color: #" + (i % 2 == 0 ? "ddd" : "eee") + "'>" + 
              "<h3>" + date["title"] +  "</h3>" + 
              "<h4>" + formatDate(date["date"]) + (date["time"] ? " - " + date["time"] : "") + "</h4>" + 
              "<h5>" + (date["location"] ? date["location"] : "?") +  "</h5>" + 
              "<h5>" + (date["district"] ? date["district"] : "") + "</h5>" + 
              "<div>" + formatDateBody(date["body"]) + "</div>" + 
            "</div>";

            upcomingEventsEl.appendChild(o);
            i += 1;
          }

          //if( pastDatesLoaded ) {
            //renderDates();
          //}
          upcomingDatesLoaded = true;
        }
      };
      xhrDates.open('GET', DATES_URL, true);
      xhrDates.send('');

    });
  };

  var initDates = function() {
      var xhrDates = new XMLHttpRequest();
      xhrDates.onload = function () {
        if (xhrDates.status >= 200 && xhrDates.status < 300) {

          var dates = JSON.parse(xhrDates.response);
          var upcomingEvents = [];

          for( var i = 0 ; i < dates.length ; i++ ) {
            var date = dates[i];

            date.isUpcomingEvent = (new Date(date["date"])).getTime() + (24*60*60*1000000) >= Date.now();
            if( date && date["district"] ) {
              var n = date["district"];
              if( !district2dates[n] ) { district2dates[n] = []; }
              district2dates[n].push( date );
            }
            if( date.isUpcomingEvent ) {
              upcomingEvents.push( date );
            }
          }
          console.log('upcomingEvents', upcomingEvents);

          var upcomingEventsEl = document.getElementById("upcoming-events");
          upcomingEventsEl.innerHTML = "";
          if( upcomingEvents.length == 0 ) {
            upcomingEventsEl.innerHTML =
            "<div style='border-radius: 2em; padding: 1em; background-color: #ddd;'>" + 
              "<h3>Momentan keine geplanten Veranstaltungen</h3><h5>Schau in ein paar Tagen nochmal vorbei!</h5>";
          }
          for( var i = 0 ; i < upcomingEvents.length ; i++ ) {
            var date = upcomingEvents[i];
            if( i > 0 && i < upcomingEvents.length ) {
              var hr = document.createElement("div");
              hr.style.cssText = 'margin-top: 2em; margin-bottom: 2em;';
              upcomingEventsEl.appendChild(hr);
            }
            var o = document.createElement("div");
            o.innerHTML =
            "<div style='border-radius: 2em; padding: 1em; background-color: #" + (i % 2 == 0 ? "ddd" : "eee") + "'>" + 
              "<h3>" + date["title"] +  "</h3>" + 
              "<h4>" + formatDate(date["date"]) + (date["time"] ? " - " + date["time"] : "") + "</h4>" + 
              "<h5>" + (date["location"] ? date["location"] : "") + "</h5>" + 
              "<h5>" + (date["district"] ? date["district"] : "") + "</h5>" + 
              "<div>" + formatDateBody(date["body"]) + "</div>" + 
            "</div>";

            upcomingEventsEl.appendChild(o);
          }

          upcomingDatesLoaded = true;
        }
      };
      xhrDates.open('GET', DATES_URL, true);
      xhrDates.send('');
  };

  var initPresentation = function() {

    const PRESENTATION_URL = DATA_URL + 'case-studies.json';

    var presPos = 0;

    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        var presentation = document.getElementById("presentation");

        var res = JSON.parse(xhr.response);
        var imgs = res["data"][0]["attributes"]["image"]["data"];
        imgs.sort( function(a, b) {
          var an = a["attributes"]["name"].toLowerCase();
          var bn = b["attributes"]["name"].toLowerCase();
          if( an.length == bn.length ) {
                  return an < bn ? -1 : +1;
          }
          return (an.length - bn.length);
        });
        /*for( var i = 0 ; i < imgs.length ; i++ ) {
          console.log("image", imgs[i]);
        }*/

        var showSlide = function(i) {
                var url = imgs[i]["attributes"]["url"];
                console.log("show slide " + i + ": " + url);
                presentation.style.backgroundImage = "url('" + (DATA_URL + url) + "')";
        };

        presentation.style.display = "table-cell";
        var presNext = function(e) {
                presPos++;
                if( presPos >= imgs.length ) { presPos = imgs.length-1; }
                showSlide(presPos);
        };
        var presPrev = function(e) {
                presPos--;
                if( presPos < 0 ) { presPos = 0; }
                showSlide(presPos);
                e.preventDefault();
                return false;
        };
        presentation.addEventListener("click", presNext);
        presentation.addEventListener("contextmenu", presPrev);
        document.getElementById( "pres-next" ).addEventListener("click", presNext);
        document.getElementById( "pres-prev" ).addEventListener("click", presPrev);
        showSlide(0);
      }
    };
    xhr.open('GET', PRESENTATION_URL, true);
    xhr.send('');
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
          o.innerHTML = "<img src='img/pdf.png' style='height: 1.5em; margin-right: 0.5em;'><a style='vertical-align: super;' href='" + (DATA_URL + 'files/' + dl["field_pdf"][0]["url"]) + "'>" + dl["title"][0]["value"] + "</a>";
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

  var updateMenuHeight = function() {
    //console.log('scrollY', window.scrollY);
    var h = document.getElementById( 'header' );
    if( window.scrollY > 200 ) {
            h.style.height = '2em';
    } else {
            h.style.height = '5em';
    }
  };

  var init = function() {
    document.addEventListener('scroll', function(e) {
      updateMenuHeight();
    });

    PAGES.forEach( function(p, i) {
      document.getElementById("menu-" + p).addEventListener('click', function(ev) {
        scrollToTargetAdjusted("target-" + p);
      });
    });

    initDownloads();
    initSlideShow();
    initPresentation();
    initTexts();
    //var res = buildMap();
    //if( res ) { initMap(); }
    initDates();

    // fixes firefox iframe bug
    document.getElementById('map-iframe').src = 'https://staging.app.xtransform.org/?embedded=true';
  };

  init();

})();



