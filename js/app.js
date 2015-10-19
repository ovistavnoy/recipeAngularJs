var app = angular.module('app', ['ionic', 'ngCordova', 'ngStorage']);

app.constant('categoriesConstant', [
    {id: 1, name: 'Торты'},
    {id: 2, name: 'Печенье'},
    {id: 3, name: 'Пироги'},
    {id: 4, name: 'Десерты'},
    {id: 5, name: 'Первое'},
    {id: 6, name: 'Второе'},
    {id: 7, name: 'Мясное'},
    {id: 8, name: 'Салаты'},
    {id: 9, name: 'Напитки'}
]);

app.filter('nl2br', ['$sce', function ($sce) {
    return function (text) {
        return text ? $sce.trustAsHtml(text.replace(/\n/g, '<br>')) : '';
    };
}]);

app.filter('list', ['$sce', function ($sce) {
    return function (text) {
        var result = '';
        if(text) {
            var li = text.split(/\n/g);
            result += '<ul class="list-ingredients">';
            for(var i=0; i<li.length; i++) {
                result += '<li>'+li[i]+'</li>';
            }
            result += '</ul>';
        }
        return $sce.trustAsHtml(result);
    };
}]);

app.directive('focusMe', function($timeout) {
    return {
        link: function(scope, element, attrs) {
            $timeout(function() {
                element[0].focus();
            });
        }
    };
});

app.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
    $ionicConfigProvider.views.maxCache(0);
    $urlRouterProvider.otherwise('/');
    $stateProvider
        .state('home', {
            url: '/',
            templateUrl: 'home.tpl',
            controller: 'HomeCtrl'
        })
        .state('categories', {
            url: '/categories/',
            templateUrl: 'categories.tpl',
            controller: 'CategoriesCtrl'
        })
        .state('favorites', {
            url: '/favorites/',
            templateUrl: 'recipes.tpl',
            controller: 'FavoritesCtrl'
        })
        .state('recipes', {
            url: '/recipes/:categoryId',
            templateUrl: 'recipes.tpl',
            controller: 'RecipesCtrl'
        })
        .state('recipe', {
            url: '/recipe/:recipeId',
            templateUrl: 'recipe.tpl',
            controller: 'RecipeCtrl'
        })
        .state('form-recipe', {
            url: '/form-recipe/',
            templateUrl: 'form-recipe.tpl',
            controller: 'FormRecipeCtrl'
        })
        .state('form-recipe-id', {
            url: '/form-recipe/recipeId-:recipeId',
            templateUrl: 'form-recipe.tpl',
            controller: 'FormRecipeCtrl'
        })
        .state('form-recipe-category', {
            url: '/form-recipe/categoryId-:categoryId',
            templateUrl: 'form-recipe.tpl',
            controller: 'FormRecipeCtrl'
        });
});

app.controller('HomeCtrl', ['$scope', 'RecipeService', '$timeout', 'CategoryService',
    function($scope, RecipeService, $timeout, CategoryService) {
        $scope.turnOnSearch = false;
        $scope.categories = CategoryService.getCategories();
        $scope.exit = function() {
            navigator.app.exitApp();
        };
        $scope.clearBase = function() {
            RecipeService.reset();
        };
        $scope.showSearch = function() {
            $scope.turnOnSearch = !$scope.turnOnSearch;
            $scope.search = {name: ''};
            if($scope.turnOnSearch) {
                $timeout(function() {
                    document.querySelector( 'input[name=search]' ).focus()
                });
            }
        };
        $scope.recipes = RecipeService.getRecipes();
    }
]);

app.controller('CategoriesCtrl', ['$scope', 'CategoryService',
    function($scope, CategoryService) {
        $scope.categories = CategoryService.getCategories();
    }
]);

app.controller('RecipesCtrl', ['$scope', '$stateParams', 'CategoryService', 'RecipeService', '$state', '$timeout',
    function($scope, $stateParams, CategoryService, RecipeService, $state, $timeout) {
        $scope.turnOnSearch = false;
        $scope.categoryId = $stateParams.categoryId;
        $scope.categoryName = CategoryService.getCategoryById($scope.categoryId);
        $scope.recipes = RecipeService.getRecipes({categoryId: $scope.categoryId});

        $scope.addRecipe = function() {
            $state.go('form-recipe-category', {categoryId: $scope.categoryId})
        };

        $scope.showSearch = function() {
            $scope.turnOnSearch = !$scope.turnOnSearch;
            $scope.search = {name: ''};
            if($scope.turnOnSearch) {
                $timeout(function() {
                    document.querySelector('input[name=search]').focus()
                });
            }
        };

        $scope.setSearchUsed = function(value) {
            value = parseInt(value) ? true : false;
            $scope.search.used = $scope.search.used != value ? value : undefined;
        };

        $scope.predicate = 'name';
        $scope.reverse = true;
        $scope.test = function(predicate) {
            $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
            $scope.predicate = predicate;
        };
    }
]);

app.controller('FavoritesCtrl', ['$scope', '$stateParams', 'CategoryService', 'RecipeService',
    function($scope, $stateParams, CategoryService, RecipeService) {
        $scope.notAdd = true;
        $scope.categoryName = 'Любимые';
        $scope.recipes = RecipeService.getFromFavRecipe();
    }
]);

app.controller('RecipeCtrl', ['$scope', '$window', '$stateParams', 'RecipeService', 'CategoryService', '$state', '$ionicPopup',
    function($scope, $window, $stateParams, RecipeService, CategoryService, $state, $ionicPopup) {
        var recipeId = parseInt($stateParams.recipeId);
        $scope.recipe = RecipeService.getRecipes({'ids': [recipeId]})[0];

        $scope.showConfirm = function() {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Удаление рецепта',
                template: 'Вы уверены что хотите удалить рецепт '+$scope.recipe.name+'?'
            });
            confirmPopup.then(function(res) {
                if(res) {
                    RecipeService.removeRecipe($scope.recipe.id);
                    $state.go('categories');
                }
            });
        };

        $scope.toggleFavorite = function() {
            if($scope.recipe.isFav)
                RecipeService.removeFromFavRecipe($scope.recipe.id);
            else
                RecipeService.addToFavRecipe($scope.recipe.id);
        };

        $scope.doEdit = function() {
            $state.go('form-recipe-id', {recipeId: $scope.recipe.id})
        };

    }
]);

app.controller('FormRecipeCtrl', ['$scope', 'RecipeService', 'CategoryService', '$state', '$stateParams', '$cordovaCamera', '$cordovaFile',
    function($scope, RecipeService, CategoryService, $state, $stateParams, $cordovaCamera, $cordovaFile) {
        $scope.submited = false;
        $scope.categories = CategoryService.getCategories();
        $scope.action = 'create';
        $scope.images = [];

        if($stateParams.categoryId != undefined) {
            $scope.recipe = {categoryId: parseInt($stateParams.categoryId)};
        }
        if($stateParams.recipeId != undefined) {
            $scope.recipe = RecipeService.getRecipes({'ids': [parseInt($stateParams.recipeId)]})[0];
            $scope.action = 'edit';
        }
        $scope.reset = function() {
            $scope.recipe = {};
        };

        $scope.submitForm = function (recipeForm, data) {
            $scope.submited = true;
            if (recipeForm.$valid) {
                var recipeId;
                if(data.used == undefined) data.used = false;
                if(data.id) {
                    recipeId = RecipeService.updateRecipe(data);
                } else {
                    recipeId = RecipeService.saveRecipe(data);
                }
                $state.go('recipe', {recipeId: recipeId});
            }
        };

        $scope.capturePhoto = function() {
            try {
                var options = {
                    quality: 100,
                    destinationType: Camera.DestinationType.FILE_URI,
                    sourceType: Camera.PictureSourceType.CAMERA,
                    encodingType: Camera.EncodingType.JPEG,
                    cameraDirection: 1,
                    saveToPhotoAlbum: true
                };

                $cordovaCamera.getPicture(options).then(function(imagePath){

                    //Grab the file name of the photo in the temporary directory
                    var currentName = imagePath.replace(/^.*[\\\/]/, '');

                    //Create a new name for the photo
                    var d = new Date(),
                        n = d.getTime(),
                        newFileName = n + ".jpg";

                    //Move the file to permanent storage
                    $cordovaFile.moveFile(cordova.file.tempDirectory, currentName, cordova.file.dataDirectory, newFileName).then(function(success){
                        $scope.images.push(cordova.file.dataDirectory + '/' + newFileName);
                        //success.nativeURL will contain the path to the photo in permanent storage, do whatever you wish with it, e.g:
                        //createPhoto(success.nativeURL);

                    }, function(error){
                        //an error occured
                    });

                }, function(error){
                    //An error occured
                });
            } catch (err) {
                alert(err.message)
            }
        };

    }
]);


app.service('CategoryService', function (categoriesConstant, RecipeService) {
    return {
        getCategories: function() {
            var categories = categoriesConstant;
            var countCategories = RecipeService.getCountRecipeByCategories();
            for(var i=0; i<categories.length; i++) {
                categories[i].count = countCategories[categories[i].id] == undefined ? 0 : countCategories[categories[i].id];
            }
            return categories;

        },
        getCategoryById: function(id) {
            for(var i=0; i<categoriesConstant.length; i++) {
                if(categoriesConstant[i].id == id) return categoriesConstant[i].name;
            }
            return null;
        }
    }
});

app.service('RecipeService', function (categoriesConstant, $localStorage) {
        if ($localStorage.recipes == undefined)
            $localStorage.$reset({recipes: [], lastId: 0});
        return {
            reset: function () {
                $localStorage.$reset({recipes: [], lastId: 0});
            },
            saveRecipe: function (data) {
                data.datetime = new Date().getTime();
                data.inFav = false;
                data.usedText = data.used ? 'Да' : 'Нет';
                for(var i=0; i<categoriesConstant.length; i++) {
                    if(categoriesConstant[i].id == data.categoryId) {
                        data.categoryName = categoriesConstant[i].name;
                        break;
                    }
                }
                data.id = ++$localStorage.lastId;
                $localStorage.recipes.push(data);
                return data.id;
            },
            updateRecipe: function (data) {
                for(var i=0; i<$localStorage.recipes.length; i++) {
                    if($localStorage.recipes[i].id == data.id) {
                        $localStorage.recipes[i] = angular.extend({}, $localStorage.recipes[i], data);
                        break;
                    }
                }
                return data.id;
            },
            getRecipes: function(params) {
                var result = [];
                for(var i=0; i<$localStorage.recipes.length; i++) {
                    if(params == undefined ||
                        (params.categoryId != undefined && params.categoryId == $localStorage.recipes[i].categoryId) ||
                        (params.ids != undefined && params.ids.indexOf($localStorage.recipes[i].id) !== -1)
                    ) {
                        result.push($localStorage.recipes[i]);
                        if(params != undefined && params.ids != undefined && params.ids.length == result.length) break;
                    }
                }
                return result;
            },
            getCountRecipeByCategories: function() {
                var result = {};
                for(var i=0; i<$localStorage.recipes.length; i++) {
                    if(result[$localStorage.recipes[i].categoryId] == undefined) result[$localStorage.recipes[i].categoryId] = 0;
                    result[$localStorage.recipes[i].categoryId]++;
                }
                return result;
            },
            removeRecipe: function(id) {
                for(var i=0; i<$localStorage.recipes.length; i++) {
                    if($localStorage.recipes[i].id == id) {
                        $localStorage.recipes.splice(i, 1);
                        break;
                    }
                }
            },
            addToFavRecipe: function(id) {
                for(var i=0; i<$localStorage.recipes.length; i++) {
                    if($localStorage.recipes[i].id == id) {
                        $localStorage.recipes[i].isFav = true;
                        break;
                    }
                }
            },
            removeFromFavRecipe: function(id) {
                for(var i=0; i<$localStorage.recipes.length; i++) {
                    if($localStorage.recipes[i].id == id) {
                        $localStorage.recipes[i].isFav = false;
                        break;
                    }
                }
            },
            getFromFavRecipe: function() {
                var result = [];
                for(var i=0; i<$localStorage.recipes.length; i++) {
                    if($localStorage.recipes[i].isFav) {
                        result.push($localStorage.recipes[i]);
                    }
                }
                return result;
            }
        }
    }
);