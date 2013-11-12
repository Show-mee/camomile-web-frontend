'use strict';

angular.module('myApp.controllers', ['myApp.services'])
		.controller('CorpusCtrl', ['$scope', 'Corpus', function($scope, Corpus) {
			$scope.model = {
				corpusTitle: "Corpora",
				corpusOpened: false
			};
			$scope.$watch('model.corpusOpened', function(newValue, oldValue, scope) {
				if (newValue) {
					scope.model.corpuses = Corpus.query();
				} else {
					scope.model.corpuses = undefined;
				}
			});
		}])


		.controller('MediaCtrl', ['$scope', 'Media', function($scope, Media) {
			$scope.model = {
				mediaTitle: "Media",
				mediaOpened: false
			};

			$scope.$watch('model.mediaOpened', function(newValue, oldValue, scope) {
				if (newValue) {
					scope.model.media = Media.query({corpusId: scope.corpus._id});
				} else {
					scope.model.media = undefined;
				}
			});
			$scope.$watch('model.corpusOpened', function(newValue, oldValue, scope) {
				if (!newValue) {
					scope.model.mediaOpened = false;
				}
			});
		}])


		.controller('LayerCtrl', ['$scope', 'Layer', function($scope, Layer) {
			$scope.model = {
				layerTitle: "Layers",
				layerOpened: false
			};

			$scope.$watch('model.layerOpened', function(newValue, oldValue, scope) {
				if (newValue) {
					scope.model.layers = Layer.query({corpusId: scope.corpus._id, mediaId:scope.media._id});
				} else {
					scope.model.layers = undefined;
				}
			});
			$scope.$watch('model.mediaOpened', function(newValue, oldValue, scope) {
				if (!newValue) {
					scope.model.layerOpened = false;
				}
			});
		}])


		.controller('AnnotationCtrl', ['$scope', 'Annotation', function($scope, Annotation) {
			$scope.model = {
				annotationTitle: "Annotations",
				annotationOpened: false
			};

			$scope.$watch('model.annotationOpened', function(newValue, oldValue, scope) {
				if (newValue) {
					scope.model.annotations = Annotation.query({corpusId: scope.corpus._id, mediaId: scope.media._id, layerId: scope.layer._id});
				} else {
					scope.model.annotations = undefined;
				}
			});
			$scope.$watch('model.layerOpened', function(newValue, oldValue, scope) {
				if (!newValue) {
					scope.model.annotationOpened = false;
				}
			});
		}])



	.controller('DiffCtrl',
	['$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation', 'CMError',
	function($scope, $http, Corpus, Media, Layer, Annotation, CMError) {

		delete $http.defaults.headers.common['X-Requested-With'];

		$scope.model = {};

		// layers[0] is the reference
		// layers[1] is the hypothesis
		// layers[2] is their difference
		$scope.model.layers = [
			{
				'label': 'Reference',
				'_id': 0,
				'layer': [],
				'mapping': null,
				'tooltipFunc': null
			},
			{
				'label': 'Hypothesis',
				'_id': 1,
				'layer': [],
				'mapping': null,
				'tooltipFunc': null
			},
			{
				'label': 'Difference',
				'_id': 2,
				'layer': [],
				'mapping': null,
				'tooltipFunc': null
			}
		];

		// selected corpus ID
		$scope.model.selected_corpus = "";

		// selected medium ID
		$scope.model.selected_medium = "";

		// selected reference layer ID
		$scope.model.selected_reference = "";

		// selected hypothesis layer ID
		$scope.model.selected_hypothesis = "";

		// list of annotations
		$scope.model.reference = [];
		$scope.model.hypothesis = [];
		$scope.model.diff = [];

		// get list of corpora
		$scope.get_corpora = function() {
			$scope.model.available_corpora = Corpus.query();
		};

		// get list of media for a given corpus
		$scope.get_media = function(corpus_id) {
			$scope.model.available_media = Media.query({corpusId: corpus_id});
		};

		// get list of layers for a given medium
		$scope.get_layers = function(corpus_id, medium_id) {
			$scope.model.available_layers = Layer.query(
				{corpusId: corpus_id, mediaId: medium_id});
		};

		// get list of reference annotations from a given layer
		// and update difference with hypothesis when it's done
		$scope.get_reference_annotations = function(corpus_id, medium_id, layer_id) {
			$scope.model.reference = Annotation.query(
				{corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
				function() {
					var layer = {
						'label': 'Reference',
						'_id': layer_id,
						'layer': $scope.model.reference,
						'mapping': null,
     				'tooltipFunc': null
					}
					$scope.model.layers[0] = layer;
					$scope.model.latestLayer = layer;
					$scope.compute_diff();
				}
			);
		};

		// get list of hypothesis annotations from a given layer
		// and update difference with reference when it's done
		$scope.get_hypothesis_annotations = function(corpus_id, medium_id, layer_id) {
			$scope.model.hypothesis = Annotation.query(
				{corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
				function() {
					var layer = {
						'label': 'Hypothesis',
						'_id': layer_id,
						'layer': $scope.model.hypothesis,
						'mapping': null,
     				'tooltipFunc': null
					}
					$scope.model.layers[1] = layer;
					$scope.model.latestLayer = layer;
					$scope.compute_diff();
				});
		};

		// update difference between reference and hypothesis
		$scope.compute_diff = function() {

			var reference_and_hypothesis = {
				'hypothesis': $scope.model.hypothesis,
				'reference': $scope.model.reference
			};

			CMError.diff(reference_and_hypothesis).success(function(data, status) {
				$scope.model.diff = data;
				var layer = {
					'label': 'Difference',
					'_id': $scope.model.layers[0]._id + '_vs_' + $scope.model.layers[1]._id,
					'layer': $scope.model.diff,
					'mapping': null,
 					'tooltipFunc': null
				}
				$scope.model.layers[2] = layer;
				$scope.model.latestLayer = layer;
			});
		}

		$scope.$watch('model.selected_corpus', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_media(scope.model.selected_corpus);
			}
		});

		$scope.$watch('model.selected_medium', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_layers(scope.model.selected_corpus, scope.model.selected_medium);
			}
		});

		$scope.$watch('model.selected_reference', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_reference_annotations(
					scope.model.selected_corpus,
					scope.model.selected_medium,
					scope.model.selected_reference);
			}
		});

		$scope.$watch('model.selected_hypothesis', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_hypothesis_annotations(
					scope.model.selected_corpus,
					scope.model.selected_medium,
					scope.model.selected_hypothesis);
			}
		});

	}])

	.controller('RegressionCtrl',
	['$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation', 'CMError',
	function($scope, $http, Corpus, Media, Layer, Annotation, CMError) {

	  delete $http.defaults.headers.common['X-Requested-With'];

		$scope.model = {};
		$scope.model.selected_corpus = "";
		$scope.model.selected_medium = "";
		$scope.model.selected_reference = "";
		$scope.model.selected_before = "";
		$scope.model.selected_after = "";
		$scope.model.reference = [];
		$scope.model.before = [];
		$scope.model.after = [];
		$scope.model.regression = [];

		$scope.get_corpora = function() {
			$scope.model.available_corpora = Corpus.query();
		};

		$scope.get_media = function(corpus_id) {
			$scope.model.available_media = Media.query({corpusId: corpus_id});
		};

		$scope.get_layers = function(corpus_id, medium_id) {
			$scope.model.available_layers = Layer.query(
				{corpusId: corpus_id, mediaId: medium_id});
		};

		$scope.get_reference_annotations = function(corpus_id, medium_id, layer_id) {
			$scope.model.reference = Annotation.query(
				{corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
				$scope.compute_regression);
		};

		$scope.get_before_annotations = function(corpus_id, medium_id, layer_id) {
			$scope.model.before = Annotation.query(
				{corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
				$scope.compute_regression);
		};

		$scope.get_after_annotations = function(corpus_id, medium_id, layer_id) {
			$scope.model.after = Annotation.query(
				{corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
				$scope.compute_regression);
		};

		$scope.compute_regression = function() {

			var reference_and_hypotheses = {
				'reference': $scope.model.reference,
				'before': $scope.model.before,
				'after': $scope.model.after
			};

			CMError.regression(reference_and_hypotheses).success(function(data, status) {
				$scope.model.regression = data;
			});
		}

		$scope.$watch('model.selected_corpus', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_media(scope.model.selected_corpus);
			}
		});

		$scope.$watch('model.selected_medium', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_layers(scope.model.selected_corpus, scope.model.selected_medium);
			}
		});

		$scope.$watch('model.selected_reference', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_reference_annotations(
					scope.model.selected_corpus,
					scope.model.selected_medium,
					scope.model.selected_reference);
			}
		});

		$scope.$watch('model.selected_before', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_before_annotations(
					scope.model.selected_corpus,
					scope.model.selected_medium,
					scope.model.selected_before);
			}
		});

		$scope.$watch('model.selected_after', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_after_annotations(
					scope.model.selected_corpus,
					scope.model.selected_medium,
					scope.model.selected_after);
			}
		});
	}])

	.controller('SelectListCtrl',
	['$scope', 'Corpus', 'Media', 'Layer', 'Annotation',
	function($scope, Corpus, Media, Layer, Annotation) {

		// mock controller for testing timeline component
		$scope.model = {
				layers: [],
				stockLayers: [],
				curId: 0,
				mediaName: ""
		};

		Corpus.get({corpusId: "524c35740ef6bde125000001"}, function(corp) {
			Media.get({corpusId: corp._id, mediaId: "525bf32fbb9d24dc28000001"}, function(media) {
				$scope.model.mediaName = "- " + media.name;
				Layer.query({corpusId: corp._id, mediaId: media._id}, function(layers){
					layers.forEach(function (l, i) {
						Annotation.query({corpusId: corp._id, mediaId: media._id, layerId: l._id}, function(annots) {
							var obj = {
								_id: l._id,
								layer: annots,
								label: l.layer_type
							};
							$scope.model.stockLayers.push(obj);
						});
					});
				});
			});
		});

		$scope.addLayer = function() {
			$scope.model.layers.push($scope.model.stockLayers[$scope.model.curId]);
			$scope.model.latestLayer = $scope.model.stockLayers[$scope.model.curId];
			$scope.model.curId++;
		};

		$scope.removeLayer = function() {
			$scope.model.latestLayer = $scope.model.layers.pop();
			$scope.model.curId--;
		};

	}])

	.controller('AnalysisCtrl',
	['$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation', 'CMError',
	function($scope, $http, Corpus, Media, Layer, Annotation, CMError) {
		delete $http.defaults.headers.common['X-Requested-With'];

		$scope.model = {
			pageSwitch: "select", // possible values : "select" and "analysis"
			pageTitle: "Select corpus and media",
			selectedCorpusName: "Select corpus",
			selectedMediaName: "Select media",
			selectedCorpusId: undefined,
			selectedMediaId: undefined,
			selectedMethodName: "Method",
			selectedRefName: "Reference",
			selectedFirstHypName: "1st_Hypothesis",
			selectedSecondHypName: "2nd_Hypothesis",
			selectedMethodId: undefined,
			selectedRefId: undefined,
			selectedFirstHypId: undefined,
			selectedSecondHypId: undefined
		};

		$scope.model.corpora = Corpus.query();
		$scope.model.media = [];
		$scope.model.methods = ['Diff', 'Regression'];

		$scope.model.availableLayers = [];

		$scope.model.layers = [];
		$scope.model.layerWatch = [];
		$scope.model.latestLayer = {};

		$scope.model.probe = function() {
			console.log($scope.model.selectedCorpusId);
		};

		$scope.model.setSwitch = function(sw) {
			$scope.model.pageSwitch = sw;
			if(sw === "select") {
				$scope.model.pageTitle = "Select corpus and media";
				$scope.model.selectedCorpusId = undefined;
				$scope.model.selectedMediaId = undefined;
			} else {
				$scope.model.pageTitle = "Analyze media";
				$scope.model.selectedMethodId = undefined;
				$scope.model.selectedRefId = undefined;
				$scope.model.selectedFirstHypId = undefined;
				$scope.model.selectedSecondHypId = undefined;
			}
		};


		$scope.updateLayerForRole = (function() {
			var refPos = undefined;
			var firstPos = undefined;
			var secondPos = undefined;
			var computedPos = undefined;

			return function(role, layer) {
				var curPos, newPos;
				switch(role) {
					case 'ref':
						newPos = 0;
						curPos = refPos;
						refPos = (layer === undefined) ? undefined : newPos;
						break;
					case 'first':
						newPos = 0 + (refPos !== undefined);
						curPos = firstPos;
						firstPos = (layer === undefined) ? undefined : newPos;
						break;
					case 'second':
						newPos = (0 + (refPos !== undefined)
							+ (firstPos !== undefined));
						curPos = secondPos;
						secondPos = (layer === undefined) ? undefined : newPos;
						break;
					case 'computed':
						newPos = (0 + (refPos !== undefined)
							+ (firstPos !== undefined)
							+ (secondPos !== undefined));
						curPos = computedPos;
						computedPos = (layer === undefined) ? undefined : newPos;
						break;
				}

				if(layer !== undefined) {
					$scope.model.latestLayer = layer;
					$scope.model.layers.splice(newPos, 0 + (curPos !== undefined), layer);
					$scope.model.layerWatch.splice(newPos, 0 + (curPos !== undefined), layer._id);
				} else {
					$scope.model.latestLayer = $scope.model.layers.splice(newPos, 0 + (curPos !== undefined));
					$scope.model.layerWatch.splice(newPos, 0 + (curPos !== undefined));
				}
			};
		}());


		$scope.$watch('model.selectedCorpusId', function(newValue, oldValue, scope) {
			if(newValue !== undefined) {
				$scope.model.selectedCorpusName = $.grep($scope.model.corpora, function(el) {
					return el._id === newValue;
				})[0].name;
				$scope.model.media = Media.query({corpusId: newValue});
			} else {
				$scope.model.selectedCorpusName = "Select corpus";
			}
		});

		$scope.$watch('model.selectedMediaId', function(newValue, oldValue, scope) {
			if(newValue !== undefined) {
				$scope.model.selectedMediaName = $.grep($scope.model.media, function(el) {
					return el._id === newValue;
				})[0].name;
			} else {
				$scope.model.selectedMediaName = "Select media";
			}
		});

		$scope.$watch('model.selectedMethodId', function(newValue, oldValue, scope) {
			if(newValue !== undefined) {
				$scope.model.selectedMethodName = $scope.model.methods[newValue];
				if($scope.model.selectedMethodName !== 'Regression') {
					$scope.model.selectedSecondHypId = undefined;
				}
			} else {
				$scope.model.selectedMethodName = "Method";
			}
			scope.updateComputedLayer();
		});

		$scope.$watch('model.selectedRefId', function(newValue, oldValue, scope) {
			if(newValue !== undefined) {
				var newLayer = $.grep($scope.model.availableLayers, function(el) {
					return el._id === newValue;
				})[0];
				$scope.model.selectedRefName = newLayer.label;
				$scope.updateLayerForRole('ref', newLayer);
				newLayer.available = false;
			} else if(oldValue !== undefined) {
				var oldLayer = $.grep($scope.model.availableLayers, function(el) {
					return el._id === oldValue;
				})[0];
				$scope.model.selectedRefName = "Reference";
				$scope.updateLayerForRole('ref');
				oldLayer.available = true;
			}
			scope.updateComputedLayer();
		});

		$scope.$watch('model.selectedFirstHypId', function(newValue, oldValue, scope) {
			if(newValue !== undefined) {
				var newLayer = $.grep($scope.model.availableLayers, function(el) {
					return el._id === newValue;
				})[0];
				$scope.model.selectedFirstHypName = newLayer.label;
				$scope.updateLayerForRole('first', newLayer);
				newLayer.available = false;
			} else if(oldValue !== undefined) {
				var oldLayer = $.grep($scope.model.availableLayers, function(el) {
					return el._id === oldValue;
				})[0];
				$scope.model.selectedFirstHypName = "1st_Hypothesis";
				$scope.updateLayerForRole('first');
				oldLayer.available = true;
			}
			scope.updateComputedLayer();
		});

		$scope.$watch('model.selectedSecondHypId', function(newValue, oldValue, scope) {
			if(newValue !== undefined) {
				var newLayer = $.grep($scope.model.availableLayers, function(el) {
					return el._id === newValue;
				})[0];
				$scope.model.selectedSecondHypName = newLayer.label;
				$scope.updateLayerForRole('second', newLayer);
				newLayer.available = false;
			} else if(oldValue !== undefined) {
				var oldLayer = $.grep($scope.model.availableLayers, function(el) {
					return el._id === oldValue;
				})[0];
				$scope.model.selectedSecondHypName = "2nd_Hypothesis";
				$scope.updateLayerForRole('second');
				oldLayer.available = true;
			}
			scope.updateComputedLayer();
		});


		$scope.updateComputedLayer = function() {
			// set here the logic to decide when the computed layer has to be updated,
			// get the layer from http call,
			// and perform layer model.layers update in the callback.
		}


		// add in a availableLayers tab,
		// layers being what has to be displayed. reference, hypotheses and diff/regress are put to fixed positions, and managed through controller

		$scope.$watch('model.pageSwitch', function(newValue, oldValue, scope) {
			if(newValue == 'analyze') {
				Layer.query({corpusId: scope.model.selectedCorpusId, mediaId: scope.model.selectedMediaId}, function(layers){
					layers.forEach(function (l,i) {
						Annotation.query({corpusId: scope.model.selectedCorpusId, mediaId: scope.model.selectedMediaId, layerId: l._id}, function(annots) {
							$scope.model.availableLayers.push({
								'available': true,
								'label': l.layer_type,
								'_id': "" + l._id,
								'layer': annots
								// do not use null, but undefined for default choices - this allows omission
//								'mapping': null,
//								'tooltipFunc': null
							});
						});
					});
				});
			} else {
				scope.model.availableLayers = [];
			}
		});

	}]);










