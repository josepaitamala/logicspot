/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

define([
    'Magento_Ui/js/modal/alert',
    'jquery',
    'jquery/ui',
    'mage/validation'
], function (alert, $) {
    'use strict';

    $.widget('mage.updateShoppingCart', {
        options: {
            validationURL: '',
            eventName: 'updateCartItemQty'
        },

        /** @inheritdoc */
        _create: function () {
            this._on(this.element, {
                'submit': this.onSubmit
            });

            this.onQtyChange();
        },

        onQtyChange: function() {
            var self = this,
                qtyItems = $(this.element).find('.control.qty');

            qtyItems.each( function(i,el) {
                var jsQtyAction = $(el).find('.js-qty-action'),
                    qtyInput = $(el).find('[data-role=cart-item-qty]');

                jsQtyAction.on('click', function(e) {
                    var qty = qtyInput.val().trim(),
                        qty = parseInt(qty),
                        timer = null,
                        updateCart = function() {
                            $(self.element).find('.action.update').trigger('click');
                            timer = null;
                        };

                    if ($(this).hasClass('js-qty-action--up')) {
                        //console.log(qty);
                        qtyInput.val('' + (qty < 10 ? qty + 1 : qty));
                        if (timer) {
                            clearTimeout(timer);
                            timer = null;
                        }
                        if (qty != 10) {
                            timer = setTimeout(updateCart, 2000);
                        }
                    }
                    else if ($(this).hasClass('js-qty-action--down')) {
                        //console.log(qty);
                        qtyInput.val('' + (qty > 1 ? qty - 1 : qty));

                        if (timer) {
                            clearTimeout(timer);
                            timer = null;
                        }
                        if (qty != 1) {
                            timer = setTimeout(updateCart, 2000);
                        }
                    }
                });
            });
        },

        /**
         * Prevents default submit action and calls form validator.
         *
         * @param {Event} event
         * @return {Boolean}
         */
        onSubmit: function (event) {
            if (!this.options.validationURL) {
                return true;
            }

            if (this.isValid()) {
                event.preventDefault();
                this.validateItems(this.options.validationURL, this.element.serialize());
            }

            return false;
        },

        /**
         * Validates requested form.
         *
         * @return {Boolean}
         */
        isValid: function () {
            return this.element.validation() && this.element.validation('isValid');
        },

        /**
         * Validates updated shopping cart data.
         *
         * @param {String} url - request url
         * @param {Object} data - post data for ajax call
         */
        validateItems: function (url, data) {
            $.extend(data, {
                'form_key': $.mage.cookies.get('form_key')
            });

            $.ajax({
                url: url,
                data: data,
                type: 'post',
                dataType: 'json',
                context: this,

                /** @inheritdoc */
                beforeSend: function () {
                    $(document.body).trigger('processStart');
                },

                /** @inheritdoc */
                complete: function () {
                    $(document.body).trigger('processStop');
                }
            })
            .done(function (response) {
                if (response.success) {
                    this.onSuccess();
                } else {
                    this.onError(response);
                }
            })
            .fail(function () {
                this.submitForm();
            });
        },

        /**
         * Form validation succeed.
         */
        onSuccess: function () {
            $(document).trigger('ajax:' + this.options.eventName);
            this.submitForm();
        },

        /**
         * Form validation failed.
         */
        onError: function (response) {
            if (response['error_message']) {
                alert({
                    content: response['error_message']
                });
            } else {
                this.submitForm();
            }
        },

        /**
         * Real submit of validated form.
         */
        submitForm: function () {
            this.element
                .off('submit', this.onSubmit)
                .submit();
        }
    });

    return $.mage.updateShoppingCart;
});
