var initSlideShow = function() {

  const DATA_URL = 'data-new/';
  const IMAGES_URL = DATA_URL + 'images.json';

  var Slideshow = function() {
    var slideIndex = 0;

    // Next/previous controls
    var shiftSlides = function(n) {
      showSlide(slideIndex += n);
    }

    // Thumbnail image controls
    function currentSlide(n) {
      showSlide(slideIndex = n);
    }

    function showSlide(n) {
      var i;
      var slides = document.getElementsByClassName("slideshow-slide");
      var dots = document.getElementsByClassName("dot");

      slideIndex = n;
      if (n >= slides.length) { slideIndex = 0; }
      if (n < 0) { slideIndex = slides.length-1; }
      for (i = 0; i < slides.length; i++) {
          slides[i].style.display = "none";
      }
      for (i = 0; i < dots.length; i++) {
          dots[i].className = dots[i].className.replace(" active", "");
      }
      slides[slideIndex].style.display = "block";
      dots[slideIndex].className += " active";
    }

    return {
      shiftSlides: shiftSlides,
      showSlide: showSlide,
    };
  }

  var ss = Slideshow();
  document.getElementById("slideshow-next").addEventListener("click", function(ev) {
    ss.shiftSlides(+1);
  });
  document.getElementById("slideshow-prev").addEventListener("click", function(ev) {
    ss.shiftSlides(-1);
  });
  document.getElementById("slideshow-slides").addEventListener("click", function(ev) {
    ss.shiftSlides(+1);
  });

  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    var dots = document.getElementById("slideshow-dots");
    var slides = document.getElementById("slideshow-slides");
    if (xhr.status >= 200 && xhr.status < 300) {
      var imgs = JSON.parse(xhr.response);
      imgs.sort( function(a, b) {
        return a["nid"] - b["nid"];
      });
      for( var i = 0 ; i < imgs.length ; i++ ) {
        (function(i) {
          var img = imgs[i];
          var e = document.createElement("span");
          e.setAttribute("class", "dot");
          e.addEventListener("click", function(ev) { ss.showSlide(i); } );
          dots.appendChild(e);
          slides.insertAdjacentHTML('beforeend',
              '<div class="slideshow-slide fade">' +
                '<img src="' + DATA_URL + img["field_images_large"] + '">' +
                '<div class="text">' + img["title"] + (img["field_image_credits"] ? " (<i>" + img["field_image_credits"] + "</i>)" : "" ) + '</div>'+
              '</div>');
        })(i);
      }

      ss.showSlide(0);
    }
  };
  xhr.open('GET', IMAGES_URL, true);
  xhr.send('');
}
