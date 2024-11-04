( function() {


    class SubscriptionManager {
        constructor(template) {
            this.template = template;
            this.phoneNumber = location.pathname.replace('/', '');
            this.verifyPhone = this.verifyPhone.bind(this);
            this.checkPhoneVerification();
        }

        checkPhoneVerification() {
            const _this = this;

            $http.get({
                url: '/api/phone-verification/' + this.phoneNumber,
                handler: (response) => {
                    var resData = JSON.parse(response);
                    if(resData.is_phone_verified) {
                        _this.getSubscriptions();
                    } else {
                        _this.phoneVerification();
                    }
                },
                error: (response) => {
                    var resData = JSON.parse(response);
                    console.error(resData);
                }
            })
        }

        phoneVerification() {
            this.template.execute({
                template_id: 'phoneverification',
                models: {
                    phone_number: this.phoneNumber
                },
                target_id: 'subscriptions',
                insert_type: 'innerHTML',
                class_name: this
            })
        }

        verifyPhone() {
            const btn = $dom.getId('sendsms');
            const smsCode = $dom.getId('smscode');
            const headers = {
                "Content-Type": "application/json"
            }

            if(btn.hasAttribute('sms_sent')) {

                $http.post({
                    url: '/api/auth/verify-code',
                    headers,
                    bodyJSON: {
                        phone : this.phoneNumber,
                        code: smsCode.value
                    },
                    handler: (response) => {
                        btn.innerText = 'Verified';
                        btn.setAttribute('sms_sent', false);
                        location.reload();
                    },
                    error: (response) => {
                        var resData = JSON.parse(response);
                        console.error(resData);
                    }
                })

            } else {
                $http.post({
                    url: '/api/auth/send-code',
                    headers,
                    bodyJSON: {
                        phone : this.phoneNumber
                    },
                    handler: (response) => {
                        const resData = JSON.parse(response);
                        $dom.removeClass(smsCode, 'hidden');
                        btn.innerText = 'Verify';
                        btn.setAttribute('sms_sent', true);

                        if(resData.code) {
                            smsCode.value = resData.code;
                        }
                    },
                    error: (response) => {
                        var resData = JSON.parse(response);
                        console.error(resData);
                    }
                })
            }
            
        }

        getSubscriptions() {
            const _this = this;

            $http.get({
                url: '/api/users/subscriptions',
                handler: (response) => {
                    _this.renderScriptions(JSON.parse(response));
                },
                error: (response) => {
                    var resData = JSON.parse(response);
                    console.error(resData);
                }
            })
        }

        renderScriptions(data) {
            this.template.execute({
                template_id: 'usersubscriptions',
                models: {
                    user: data.user,
                    subscriptions : data.subscriptions,
                },
                target_id: 'subscriptions',
                insert_type: 'innerHTML'
            })
        }
    }


    let template;
    let isTemplate = false;
    let isDom = false;
    
    $event.bindEvent(document, 'template:loaded',  (e) => {
        template = e.detail;
        isTemplate = true;
        loadDashboard();
    });

    $event.bindEvent(document, 'DOMContentLoaded',  (e) => {
        isDom = true;
        loadDashboard();

    });

    function loadDashboard() {
        if(isDom && isTemplate) {
            new SubscriptionManager(template);
        }
    }

})();