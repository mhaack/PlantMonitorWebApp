$(document).ready(function() {

  //Navigation menu scrollTo
  $('header nav ul li a').click(function(event) {
    event.preventDefault();
    var section = $(this).attr('href');
    var section_pos = $(section).position();

    if (section_pos) {
      $(window).scrollTo({
        top: section_pos.top,
        left: '0px'
      }, 1000);
    }
  });

  $('.app_link').click(function(e) {
    event.preventDefault();
    $(window).scrollTo({
      top: $("#hero").position().top,
      left: '0px'
    }, 1000);
  });


  //Show & Hide menu on mobile
  $('.burger_icon').click(function() {
    $('header nav').toggleClass('show');
    $('header .burger_icon').toggleClass('active');
  });

  get24HourData();
  getDailyTemperatureData();
});
