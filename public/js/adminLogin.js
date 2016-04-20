(function () {
    jQuery('#loginForm').submit(function (e) {
        e.preventDefault();
        jQuery('#loginBtn').prop("disabled", true);
        var values = {};
        $.each($('#loginForm').serializeArray(), function (i, field) {
            values[field.name] = field.value;
        });
        values.password = forge_sha256(values.password);

        console.log(values);

        jQuery.ajax({
            url: '/admin/login',
            method: 'POST',
            data: values,
            success: function (data) {
                console.log(data);
                if (data.success)
                    jQuery('#loginError').html(data.msg).addClass('successMsg').fadeIn(function () {
                        jQuery(this).delay(1500).fadeOut(function () {
                            location.reload();
                        });
                    });
                else
                    jQuery('#loginError').html(data.msg).addClass('errorMsg').fadeIn(function () {
                        jQuery(this).delay(1500).fadeOut();
                        jQuery('#loginBtn').removeAttr('disabled');
                    });
            },
            error: function (err) {
                jQuery('#loginError').html(err.toString()).addClass('errorMsg').fadeIn(function () {
                    jQuery(this).delay(1500).fadeOut();
                    jQuery('#loginBtn').removeAttr('disabled');
                });
            }
        })
    });
})();