
window.log = function(){
	if(this.console){
		console.log( Array.prototype.slice.call(arguments) );
	}
};

var generateRandom = function (width, height, wallFrequency) {
	var nodes = [];
    for (var x=0; x < width; x++) {
    	var nodeRow = [];
    	var gridRow = [];
    	for(var y=0; y < height; y++) {
    		var isWall = Math.floor(Math.random()*(1/wallFrequency));
    		if(isWall == 0) {
    			nodeRow.push(GraphNodeType.WALL);
    		}
    		else  {
    			nodeRow.push(GraphNodeType.OPEN);
    		}
    	}
    	nodes.push(nodeRow);
    }
    return new Graph(nodes);
};

$(function() {

    var $grid = $("#search_grid");
    var $selectGridSize = $("#selectGridSize");
    var $searchDiagonal = $("#searchDiagonal");

    var opts = {
        gridSize: 12, 
        diagonal: $searchDiagonal.is("checked") 
    };

    var grid = new GraphSearch($grid, opts, astar.search);

    $("#btnGenerate").click(function() {
    	grid.initialize();
    });
    
    $searchDiagonal.change(function() {
        grid.setOption({diagonal: $(this).is(":checked")});
    });

});

var css = { start: "start", finish: "finish", wall: "wall", active: "active" };

function GraphSearch($graph, options, implementation) {
    this.$graph = $graph;
    this.search = implementation;
    this.opts = $.extend({wallFrequency:.2, gridSize:15}, options);
    this.initialize();
}
GraphSearch.prototype.setOption = function(opt) {
    this.opts = $.extend(this.opts, opt);
};
GraphSearch.prototype.initialize = function() {

    var self = this;
	this.grid = [];
	var nodes = [];
	var $graph = this.$graph;

	$graph.empty();

    var cellWidth = ($graph.width()/this.opts.gridSize)-2;  // -2 for border
    var cellHeight = ($graph.height()/this.opts.gridSize)-2;
    var $cellTemplate = $("<span />").addClass("grid_item").width(cellWidth).height(cellHeight);
    var startSet = false;

    for(var x=0;x<this.opts.gridSize;x++) {
        var $row = $("<div class='clear' />");

    	var nodeRow = [];
    	var gridRow = [];

    	for(var y=0;y<this.opts.gridSize;y++) {
    		var id = "cell_"+x+"_"+y;
    		var $cell = $cellTemplate.clone();
    		$cell.attr("id", id).attr("x", x).attr("y", y);
    		$row.append($cell);
    		gridRow.push($cell);

    		var isWall = Math.floor(Math.random()*(1/self.opts.wallFrequency));
    		if(isWall == 0) {
    			nodeRow.push(GraphNodeType.WALL);
    			$cell.addClass(css.wall);
    		}
    		else  {
                var cell_weight = ($("#generateWeights").prop("checked") ? (Math.floor(Math.random() * 3)) * 2 + 1 : 1);
    			nodeRow.push(cell_weight);
        		$cell.addClass('weight' + cell_weight);
    			if (!startSet) {
    				$cell.addClass(css.start);
    				startSet = true;
    			}
    		}
    	}
	    $graph.append($row);

    	this.grid.push(gridRow);
    	nodes.push(nodeRow);
    }

    this.graph = new Graph(nodes);

    // bind cell event, set start/wall positions
    this.$cells = $graph.find(".grid_item");
    this.$cells.click(function() { self.cellClicked($(this)) });
};
GraphSearch.prototype.cellClicked = function($end) {

    var end = this.nodeFromElement($end);

   	if($end.hasClass(css.wall) || $end.hasClass(css.start)) {
   		log("clicked on wall or start...", $end);
   		return;
   	}

   	this.$cells.removeClass(css.finish);
   	$end.addClass("finish");
   	var $start = this.$cells.filter("." + css.start);
   	var start = this.nodeFromElement($start);

	var sTime = new Date();
    var path = this.search(this.graph.nodes, start, end, this.opts.diagonal);
	var fTime = new Date();

	if(!path || path.length == 0)	{
	    $("#message").text("Nao conseguiu encontrar um caminho ("+(fTime-sTime)+"ms)");
	    this.animateNoPath();
	}
	else {
	    $("#message").text("A pesquisa levou " + (fTime-sTime) + "ms.");
    	if(this.opts.debug) {
	    	this.drawDebugInfo(this.opts.debug);
	    }
	    this.animatePath(path);
	}
};
GraphSearch.prototype.nodeFromElement = function($cell) {
    return this.graph.nodes[parseInt($cell.attr("x"))][parseInt($cell.attr("y"))];
};
GraphSearch.prototype.animateNoPath = function() {
    var $graph = this.$graph;
    var jiggle = function(lim, i) {
	    if(i>=lim) { $graph.css("top", 0).css("left", 0); return;  }
	    if(!i) i=0;
	    i++;
	    $graph.css("top", Math.random()*6).css("left", Math.random()*6);
	    setTimeout( function() { jiggle(lim, i) }, 5 );
    };
    jiggle(15);
};
GraphSearch.prototype.animatePath = function(path) {
	var grid = this.grid;
	var timeout = 1000 / grid.length;
	var elementFromNode = function(node) {
		return grid[node.x][node.y];
	};

    var removeClass = function(path, i) {
	    if(i>=path.length) return;
	    elementFromNode(path[i]).removeClass(css.active);
	    setTimeout( function() { removeClass(path, i+1) }, timeout*path[i].cost);
    }
    var addClass = function(path, i)  {
	    if(i>=path.length) {  // Finished showing path, now remove
	    	return removeClass(path, 0);
	    }
	    elementFromNode(path[i]).addClass(css.active);
	    setTimeout( function() { addClass(path, i+1) }, timeout*path[i].cost);
    };

    addClass(path, 0)
    this.$graph.find("." + css.start).removeClass(css.start);
    this.$graph.find("." + css.finish).removeClass(css.finish).addClass(css.start);
};


