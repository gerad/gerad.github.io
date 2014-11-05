(function() {

var app = angular.module('gsResume', []);

app.controller("ResumeCtrl", function($scope, $element, $http) {
  $http.get('/index.json').success(function(json) {
    var resume = deserialize(json);
    angular.extend($scope, resume);
  });

  $scope.pronounce = function() {
    $element[0].querySelector('.pronounciation audio').play();
  };

  $scope.skills = function() {
    return [];
  }
});

function Transmorpher() {
  this.$body = $(document.body);
  this.onScroll = this.onScroll.bind(this);
  this.updateDOM = this.updateDOM.bind(this);
}

Transmorpher.prototype.setupHeader = function() {
  var $h1 = $('header h1');
  var $img = $('header img');

  this.header = {
    h1: {
      top: $h1.position().top,
      fontSize: parseInt($h1.css('font-size'), 10),
      $el: $h1
    },
    img: {
      height: $img.height(),
      $el: $img
    }
  };

  this.onScroll();
};

Transmorpher.prototype.setupHeading = function() {
  var $h1 = $('#heading h1');
  var $img = $('#heading img');

  this.heading = {
    h1: {
      top: $h1.offset().top,
      fontSize: parseInt($h1.css('font-size'), 10),
      $el: $h1
    },
    img: {
      height: $img.height(),
      $el: $img
    }
  };

  this.onScroll();
};

Transmorpher.prototype.onScroll = function() {
  cancelAnimationFrame(this.animationRequest);

  if (!this.heading || !this.header) { return; }

  var scrollTop = document.body.scrollTop;
  var headingTop = this.heading.h1.top - scrollTop;
  var headerTop = this.header.h1.top;

  var headerHidden, headerShowing, headerShown, h1FontSize, imgHeight;

  if (headingTop >= headerTop) {
    // heading is below header, we're at the top(ish)
    headerHidden = true;
  } else {
    // heading is above header, display header (and morph if necessary)

    // calculate transitional h1 font size
    h1FontSize = this.heading.h1.fontSize - (headerTop - headingTop);
    // font size is smaller than the final font size, we're done
    if (h1FontSize < this.header.h1.fontSize) {
      h1FontSize = void 0;
    }

    // calculate transitional image height
    imgHeight = this.heading.img.height - (headerTop - headingTop);
    // image height is smaller than final image height, we're done
    if (imgHeight < this.header.img.height) {
      imgHeight = void 0;
    }

    if (!imgHeight && !h1FontSize) {
      // we're at the final sizes, we're done
      headerShown = true;
    } else {
      // we're in transition
      console.log(headingTop, headerTop);
      headerShowing = true;
    }
  }

  // update the DOM all at once
  this.headerHidden = headerHidden || false;
  this.headerShowing = headerShowing || false;
  this.headerShown = headerShown || false;
  this.h1FontSize = h1FontSize;
  this.imgHeight = imgHeight;
  this.animationRequest = requestAnimationFrame(this.updateDOM);
};

Transmorpher.prototype.updateDOM = function() {
  this.$body.toggleClass('header-hidden', this.headerHidden);
  this.$body.toggleClass('header-showing', this.headerShowing);
  this.$body.toggleClass('header-shown', this.headerShown);

  var fontSize = (this.h1FontSize ? this.h1FontSize + 'px' : '');
  this.header.h1.$el.css('font-size', fontSize);

  var imgHeight = (this.imgHeight ? this.imgHeight + 'px' : '');
  this.header.img.$el.css('height', imgHeight);
};

app.directive('headerTransmorpher', function() {
  return function link(scope, iElement, iAttrs, controller) {
    var transmorpher = new Transmorpher
    scope[iAttrs.headerTransmorpher] = transmorpher;

    var $window = $(window);
    $window.on('scroll', transmorpher.onScroll);
    scope.$on('$destroy', function() {
      $window.off('scroll', transmorpher.onScroll);
    });
  };
});

app.filter('inGroupsOf', function() {
  return function(input, count) {
    if (!angular.isArray(input)) { return input; }

    // HACK http://stackoverflow.com/questions/20963462/rootscopeinfdig-error-caused-by-filter
    if (input.groups) { return input.groups; }
    var groups = input.groups = [];

    var j = 0;
    for (var i = 0, l = input.length; i < l; ++i) {
      if (!groups[j]) { groups[j] = []; }
      groups[j].push(input[i]);
      if (groups[j].length >= count) { j++; }
    }

    return groups;
  };
});


function deserialize(json) {
  // convert project names to project objects
  for (var i = 0, il = json.jobs.length; i < il; ++i) {
    var job = json.jobs[i];

    if (!job.projects) { job.projects = []; }
    for (var j = 0, jl = job.projects.length; j < jl; ++j) {
      var projectName = job.projects[j];
      job.projects[j] = json.projects[projectName];
    }
  }

  return json;
}

})();



