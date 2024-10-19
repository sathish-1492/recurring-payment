(function () {

    class AdminManager {
        constructor(template) {
            this.template = template;
        }

        getUsers() {
            const _this = this;

            $http.get({
                url: '/api/users',
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
                template_id: 'users',
                models: {
                    users: data,
                },
                target_id: 'userList',
                insert_type: 'innerHTML',
                class_name: this
            })

            this.template.execute({
                template_id: 'adduserform',
                target_id: 'addForm',
                insert_type: 'innerHTML',
                class_name: this
            })
        }

        addUser(e) {
            e.preventDefault();
            const _this = this;

            const userId = e.target.getAttribute('data-user-id');


            const name = document.getElementById('addName').value;
            const email = document.getElementById('addEmail').value;
            const phone = document.getElementById('addPhone').value;

            const bodyJSON = {
                name: name,
                email: email,
                phone_number: phone
            }

            const headers = {
                "Content-Type": "application/json"
            }


            if (userId) {
                $http.put({
                    url: '/api/users/' + userId,
                    bodyJSON,
                    headers,
                    handler: (response) => {
                        console.log('User modified successfully!');
                        location.reload();
                    },
                    error: (response) => {
                        var resData = JSON.parse(response);
                        console.error(resData);
                    }
                })

            } else {
                $http.post({
                    url: '/api/users',
                    bodyJSON,
                    headers,
                    handler: (response) => {
                        console.log('User added successfully!');
                        location.reload();


                    },
                    error: (response) => {
                        var resData = JSON.parse(response);
                        console.error(resData);

                        if (resData.exists) {
                            const errorMessage = document.getElementById('errorMessage');
                            // Show error message if email exists
                            errorMessage.textContent = resData.message;
                            errorMessage.style.display = 'block';
                        }
                    }
                })
            }



        }

        modifyUser(e) {
            const userId = e.target.getAttribute('data-user-id');

            $http.get({
                url: '/api/users/' + userId,
                handler: (response) => {

                    const admin = new AdminManager(template);

                    template.execute({
                        template_id: 'adduserform',
                        target_id: 'addForm',
                        models: {
                            user: JSON.parse(response),
                            modify: true
                        },
                        insert_type: 'innerHTML',
                        class_name: admin
                    })
                },
                error: (response) => {
                    var resData = JSON.parse(response);
                    console.error(resData);
                }
            })

        }
    }

    let template;
    let isTemplate = false;
    let isDom = false;

    $event.bindEvent(document, 'template:loaded', (e) => {
        template = e.detail;
        isTemplate = true;
        loadDashboard();
    });

    $event.bindEvent(document, 'DOMContentLoaded', (e) => {
        isDom = true;
        loadDashboard();

    });

    function loadDashboard() {
        if (isDom && isTemplate) {
            const manager = new AdminManager(template);
            manager.getUsers()
        }
    }
})();