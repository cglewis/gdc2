/*jslint browser: true, vars: true, white: true, indent: 2 */

$(document).ready(function() {
  "use strict";

  var GITHUB_EVENT_TYPES = [
    "GistEvent",
    "PushEvent",
    "CreateEvent",
    "PullRequestEvent",
    "ForkEvent",
    "DeleteEvent",
    "IssuesEvent",
    "WatchEvent",
    "IssueCommentEvent",
    "GollumEvent",
    "DownloadEvent",
    "FollowEvent",
    "CommitCommentEvent",
    "MemberEvent",
    "PullRequestReviewCommentEvent",
    "PublicEvent",
    "ForkApplyEvent"
  ], LANGUAGES = [
    "All",
    "JavaScript",
    "Ruby",
    "Java",
    "Python",
    "Shell",
    "PHP",
    "C",
    "C++",
    "Perl",
    "Objective-C"
  ], REPOSITORIES = [
    "",
    "twitter/bootstrap",
    "octocat/Spoon-Knife",
    "mxcl/homebrew",
    "rails/rails",
    "h5bp/html5-boilerplate",
    "jquery/jquery",
    "saasbook/hw3_rottenpotatoes",
    "joyent/node",
    "robbyrussell/oh-my-zsh",
    "phonegap/phonegap-start",
    "bartaz/impress.js",
    "documentcloud/backbone",
    "mbostock/d3",
    "torvalds/linux",
    "saasbook/hw4_rottenpotatoes",
    "purplecabbage/phonegap-plugins",
    "github/gitignore",
    "wakaleo/game-of-life",
    "EllisLab/CodeIgniter",
    "symfony/symfony",
    "jquery/jquery-ui",
    "mrdoob/three.js",
    "django/django",
    "harvesthq/chosen",
    "phonegap/phonegap-plugins",
    "blueimp/jQuery-File-Upload",
    "imathis/octopress",
    "hakimel/reveal.js",
    "zendframework/zf2",
    "zurb/foundation",
    "diaspora/diaspora",
    "jquery/jquery-mobile",
    "mojombo/jekyll",
    "angular/angular.js",
    "gitlabhq/gitlabhq",
    "mathiasbynens/dotfiles",
    "fdv/typo",
    "TrinityCore/TrinityCore",
    "adobe/brackets",
    "git/git",
    "AFNetworking/AFNetworking",
    "addyosmani/todomvc",
    "cloudhead/less.js",
    "spree/spree",
    "facebook/facebook-php-sdk",
    "plataformatec/devise",
    "saasbook/typo",
    "FortAwesome/Font-Awesome",
    "JakeWharton/ActionBarSherlock",
    "facebook/three20"
  ];

  var width = 960, height = 500;

  var projection = d3.geo.wagner6()
      .scale(150);

  var path = d3.geo.path()
      .projection(projection);

  var graticule = d3.geo.graticule();

  var svg = d3.select("#vis").append("svg")
      .attr("width", width)
      .attr("height", height);

  svg.append("defs").append("path")
      .datum({type: "Sphere"})
      .attr("id", "sphere")
      .attr("d", path);

  svg.append("use")
      .attr("class", "stroke")
      .attr("xlink:href", "#sphere");

  svg.append("use")
      .attr("class", "fill")
      .attr("xlink:href", "#sphere");

  svg.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path);

  d3.json("world-110m.json", function(world) {
    svg.insert("path", ".graticule")
        .datum(topojson.object(world, world.objects.land))
        .attr("class", "land")
        .attr("d", path);

    svg.insert("path", ".graticule")
        .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
        .attr("class", "boundary")
        .attr("d", path);
  });

  //d3.select(self.frameElement).style("height", height + "px");

  var tooltip = d3.select("body").append("div")
      .attr("id", "tooltip")
      .style("display", "none")
      .style("position", "absolute");

  // Load languages into clickable links
  d3.select("#language-list").selectAll("li")
    .data(LANGUAGES).enter()
    .append("li")
      .attr("class", function(d) { return d === "All" ? "active" : ""; })
    .append("a")
      .attr("href", function(d) { return "#languages/" + d; })
      .text(function(d) { return d; })
      .attr("id", function(d) { return "languages-" + d; })
      .on("click", function() {
        $("#language-list li").removeClass("active");
        $(this).parent().addClass("active");
        return true;
      });

  // Load repositories into a select input
  d3.select("#repository-list")
    .on("change", function() {
        window.location.hash = "#repositories/" + $(this).val();
      })
    .selectAll("option")
    .data(REPOSITORIES).enter()
    .append("option")
      .attr("value", function(d) { return d; })
      .text(function(d) { return d; });

  $("#filter-selector button").on("click", function() {
    $(".radio-filter").hide();
    $("#" + $(this).attr("data-elem")).show();
  });

  var redraw_map = function(data) {
    var scale = d3.scale.log().domain([1, 1000]).range([2, 8]);

    function contributions(d) {
      var sum = 0;
      var i;
      for (i = 0; i < GITHUB_EVENT_TYPES.length; i += 1) {
        if (d[GITHUB_EVENT_TYPES[i]] !== undefined) {
          sum += parseInt(d[GITHUB_EVENT_TYPES[i]], 10);
        }
      }
      return sum;
    }

    svg.selectAll(".dots")
      .data(data).enter()
      .append("circle")
      .attr("class", "dot")
      .attr("r", function(d) { return scale(contributions(d)); })
      .attr("transform", function(d) {
        var coord = [d.lng, d.lat];
        return "translate(" + projection(coord).join(",") + ")";
      })
      .on("mouseover", function(d) {
        var m = d3.mouse(d3.select("body").node());
        tooltip.style("display", null)
            .style("left", m[0] + 30 + "px")
            .style("top", m[1] - 20 + "px")
            .html(["<p><label>Location:</label>" + d.name + "</p>",
                   "<p><label>Contributions:</label>" + contributions(d) + "</p>"].join(""));
        })
        .on("mouseout", function() {
          tooltip.style("display", "none");
      });
  };

  var langregex = /^\#languages\/([a-zA-Z0-9\-\+\.]+)$/;
  var reporegex = /^\#repositories\/([a-zA-Z0-9\-\+\.\/]+)$/;    // TODO: doens't handle unicode/weird names at all
  var hashchangehandler = function() {
    var langres = langregex.exec(window.location.hash);
    var repores = reporegex.exec(window.location.hash);
    var url = "data/";
    $("#filter-selector button").removeClass("active");
    if (langres !== null) {
      var lang = langres[1];
      $("#language-btn").trigger('click');
      $("#language-list li").removeClass("active");
      $("#languages-" + lang).parent().addClass("active");
      url += "languages/" + lang + ".json";
    } else if (repores !== null) {
      var repo = repores[1];
      $("#repository-btn").trigger('click');
      $("#repository-list").val(repo);
      url += "repositories/" + repo + ".json";
    } else {
      // Invalid anchor!
      return;
    }

    // TODO: transition
    svg.selectAll("circle.dot").transition().delay(250).style("fill-opacity", 0).remove();
    d3.json(url, redraw_map);
  };
  $(window).on("hashchange", hashchangehandler);


  // Default page to load is all languages
  if (window.location.hash === "") {
    window.location.hash = "#languages/All";
  } else {
    hashchangehandler();
  }

});