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

  $scope.print = function() {
    window.print();
  };

  $scope.setupHeader = function() {
    $scope.transmorpher.setupHeader();
  };

  $scope.setupHeading = function() {
    $scope.transmorpher.setupHeading();
  };
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

/*
app.directive('skillHighlights', function() {
  function controller($scope) {
    this.skillClassName = function(skill) {
      return skill.replace(/\W/g,'-').toLowerCase();
    }

    this.highlight = function(skill) {
      console.log('highlight', skill);
    }
  }

  return {
    scope: {},
    controller: controller
  };
});

app.directive('skill', function() {
  return {
    restrict: 'C',
    require: '^skillHighlights',
    link: function(scope, element, attrs, skillHighlights) {
      function mouseover() {
        skillHighlights.highlight(scope.skill);
      }

      scope.$on('skill-hover', function() {
        console.log('skill-over', arguments);
      });

      element.on('mouseover', mouseover);
      scope.$on('$destroy', function() {
        element.off('mouseover', mouseover);
      });
    }
  };
});
*/

app.directive('skills', function() {
  return {
    scope: { skills: "=" },
    template: '<span class="skill" ng-repeat="skill in skills">{{skill}}</span>'
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

app.run(function($anchorScroll) {
  $anchorScroll.yOffset = function() {
    return $('header').height() + 5;
  };
}).directive('href', function($anchorScroll, $location) {
  return function link($scope, $element, $attrs) {
    function scroll() {
      var href = $attrs.href;
      if (href[0] !== '#') { return; }
      $location.hash(href.slice(1));
      $anchorScroll();
    }

    $element.on('click', scroll);
    $scope.$on('$destroy', function() {
      $element.off('click', scroll);
    });
  };
});

function deserialize(json) {
  var skillCounts = {};
  var boost = 1, decay = 0.025;
  function countSkill(skill) {
    boost *= (1 - decay); // decay older skills
    if (skill in skillCounts) {
      skillCounts[skill] += boost;
    } else {
      skillCounts[skill] = boost;
    }
  }

  for (var i = 0, il = json.jobs.length; i < il; ++i) {
    var job = json.jobs[i];

    if (!job.projects) { job.projects = []; }
    for (var j = 0, jl = job.projects.length; j < jl; ++j) {
      // convert project names to project objects
      var projectName = job.projects[j];
      var project = json.projects[projectName]
      job.projects[j] = project;

      // aggregate the project skill counts
      for (var k = 0, kl = project.skills.length; k < kl; ++k) {
        var skill = project.skills[k];
        countSkill(skill);
      }
    }

    // aggregate the job skill counts
    if (!job.skills) { job.skills = []; }
    for (var j = 0, jl = job.skills.length; j < jl; ++j) {
      var skill = job.skills[j];
      countSkill(skill);
    }
  }

  // set json.skills to the project skils ordered by descending count
  var skills = [];
  for (var skill in skillCounts) { skills.push(skill); }
  json.skills = skills.sort(function(a,b) { return skillCounts[b] - skillCounts[a]; })

  console.log(json.skills);
  console.log(skillCounts);

  return json;
}

})();



