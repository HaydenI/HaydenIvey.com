$(function() {
	$('.field, textarea').focus(function() {
        if(this.title==this.value) {
            this.value = '';
        }
    }).blur(function(){
        if(this.value=='') {
            this.value = this.title;
        }
    });


    $('nav li a').hover(function(){
    	var text = $(this).text();
    	$('<span>'+text+'</span>').prependTo($(this).parent()).hide().fadeIn('fast');
    }, function(){
    	$('nav li span').remove();
    });

    $('.container').eq(0).css('opacity', 1);
    $('nav li a').click(function(){
        var idx = $('nav li a').index(this);
        var tposition = ($('.container').eq(idx).position().top) * -1;

        $('#content .wrapper').animate({
            top: tposition,
            easing: "easeOutCirc"
        });


    	$('nav li').removeClass('active');
    	$(this).parent().addClass('active');
        return false;
    });

    $('#portfolio .holder ul').flexiSlider({
        adjustSpacing: "width",
        auto: false,
        autoHideButtons: false,
        autoHideDots: false,
        dots: false,
        dotsThumbs: false,
        easing: "easeOutCirc",
        thumbnails: false,
        visible: 4
    });


    var cf1 = new LiveValidation('cf1', { onlyOnSubmit: true });
    cf1.add( Validate.Presence );
    cf1.add( Validate.Exclusion, { within: [ 'Your Name' ] });

    var cf2 = new LiveValidation('cf2', { onlyOnSubmit: true });
    cf2.add( Validate.Email) ;

    var cf3 = new LiveValidation('cf3', { onlyOnSubmit: true });
    cf3.add( Validate.Presence);
    cf3.add( Validate.Exclusion, { within: [ 'Type Message' ] });

    $('.contact-form').submit(function(){
        var form = $('.contact-form form');
        var data = {}

        if (!$('.LV_invalid_field', form).length) {

            $.post(form.attr('action'), form.serialize());

        }
        return false;
    });

    $('a.fancybox').fancybox();

});

