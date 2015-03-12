/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.controllers')

    .controller('SessionCtrl', ['$sce', '$scope', '$http', 'Session', '$cookieStore',
        function ($sce, $scope, $http, Session, $cookieStore) {

            $scope.model = {};
            $scope.model.message = undefined;

            $scope.login = function (submit) {
                var username = $("#login").val();
                var password = $("#password").val();
                // get actual values in the form, as angular scope not
                // updated from autocomplete (see index.html for info)
                Session.login({
                    username: username,
                    password: password
                })
                    .success(function () {
                        console.log('logged in as ' + username);
                        Session.isLogged = true;
                        Session.username = username;
                        $cookieStore.put("current.user", username);
                        $scope.model.message = "Connected as " + Session.username;
                        submit(); // hack to allow autofill and autocomplete support

                    })
                    .error(function () {
                        Session.isLogged = false;
                        Session.username = undefined;
                        $cookieStore.remove("current.user");
                        $scope.model.message = "Connection error";
                    });
            };


            $scope.logout = function () {
                Session.logout()
                    .success(function () {
                        Session.isLogged = false;
                        $cookieStore.remove("current.user");
                        Session.username = undefined;
                        $scope.model.message = undefined;

                        // reload page
                        window.location.reload();
                    })
                    .error(function (err) {
                        Session.isLogged = false;
                        Session.username = undefined;
                        $cookieStore.remove("current.user");
                        $scope.model.message = "Connection error";
                        console.log(err);
                    });
            };

            $scope.isLogged = function () {
                return Session.isLogged;
            };

            $scope.getUserName = function () {
                return Session.username;
            };

            // Allow to check in the coockie if the user is already set
            $scope.checkLoggin = function () {
                var currentUser = $cookieStore.get("current.user");
                if (currentUser && currentUser != "") {
                    Session.isLogged = true;
                    Session.username = currentUser;
                    $cookieStore.put("current.user", currentUser);
                    $scope.model.message = "Connected as " + Session.username;
                }

            }

        }]);