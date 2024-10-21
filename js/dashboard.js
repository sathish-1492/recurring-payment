( function() {


    class SubscriptionManager {
        constructor(template) {
            this.template = template;
        }

        getSubscriptions() {
            const _this = this;

            const params = new URLSearchParams(location.search);
            const phoneNumber = params.get('phone');
            if(!phoneNumber) {
                return;
            }

            $http.get({
                url: '/api/users/subscriptions?phone='+ phoneNumber,
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
            const manager = new SubscriptionManager(template);
            manager.getSubscriptions()
        }
    }

})();