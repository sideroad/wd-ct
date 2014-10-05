/* global jQuery */
(function($){
	$(function(){
		$('#text').change(function(){
			$('#logger').text(this.value);
		});
		$('#selectbox').change(function(){
			$('#logger').text($(this).val());
		});

		$('#button').change(function(){
			$('#logger').text('clicked button');
		});

		$('#will-be-vanish').click(function(){
			var $this = $(this);
			setTimeout(function(){
				$this.remove();
			},1000);
		});

		$('#will-be-disappear').click(function(){
			var $this = $(this);
			setTimeout(function(){
				$this.hide();
			},1000);
		});

	});

})(jQuery);