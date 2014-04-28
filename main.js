define(['platform','game','vector','staticcollidable','linesegment','editor','required','state','level','mouse','collision','keyboard','quake','resources'],function(platform,Game,Vector,StaticCollidable,LineSegment,editor,required,state,level,mouse,collision,keyboard,quake,resources) {
	var t = new Vector(0,0);
	var t2 = new Vector(0,0);
	var rs = {
		'images': ['test','dolphin','fish01','background','surface','bubble','land'],
		'audio': []
	};
	var g,game;
	platform.once('load',function() {
		var canvas = document.getElementById('main');
		game = g = new Game(startGame, canvas, [required(['chrome']),mouse,keyboard,resources(rs),state,level,collision,quake]);
		g.resources.status.on('changed',function() {
			g.graphics.context.clearRect(0,0,game.width,game.height);
			g.graphics.context.fillStyle = 'black';
			g.graphics.context.font = 'arial';
			g.graphics.fillCenteredText('Preloading ' + g.resources.status.ready + '/' + g.resources.status.total + '...',400,300);
		});
	});

	function startGame(err) {
	if (err) { console.error(err); }
	var images = g.resources.images;
	var audio = g.resources.audio;

	g.objects.lists.particle = g.objects.createIndexList('particle');
	g.objects.lists.spring = g.objects.createIndexList('spring');
	g.objects.lists.start = g.objects.createIndexList('start');
	g.objects.lists.finish = g.objects.createIndexList('finish');
	g.objects.lists.enemy = g.objects.createIndexList('enemy');
	g.objects.lists.usable = g.objects.createIndexList('usable');
	g.objects.lists.collectable = g.objects.createIndexList('collectable');
	g.objects.lists.shadow = g.objects.createIndexList('shadow');
	g.objects.lists.background = g.objects.createIndexList('background');
	g.objects.lists.foreground = g.objects.createIndexList('foreground');
	g.objects.lists.overlay = g.objects.createIndexList('overlay');
	g.objects.lists.colorized = g.objects.createIndexList('colorized');
	g.objects.lists.school = g.objects.createIndexList('school');

	// Gravity.
	// g.gravity = (function() {
	// 	var me = {
	// 		enabled: true,
	// 		enable: enable,
	// 		disable: disable,
	// 		toggle: toggle
	// 	};
	// 	function enable() { me.enabled = true; }
	// 	function disable() { me.enabled = false; }
	// 	function toggle() { if (me.enabled) disable(); else enable(); }
	// 	function update(dt,next) {
	// 		g.objects.lists.particle.each(function(p) {
	// 			if (me.enabled) {
	// 				p.velocity.y += 200*dt;
	// 			}
	// 		});
	// 		next(dt);
	// 	}
	// 	g.chains.update.push(update);
	// 	return me;
	// })();

	// Auto-refresh
	// (function() {
	// 	var timeout = setTimeout(function() {
	// 		document.location.reload(true);
	// 	}, 3000);
	// 	g.once('keydown',function() {
	// 		disable();
	// 	});
	// 	g.once('mousemove',function() {
	// 		disable();
	// 	});
	// 	g.chains.draw.unshift(draw);
	// 	function draw(g,next) {
	// 		// console.log(game.chains.draw.slice(0));
	// 		g.fillStyle('#ff0000');
	// 		g.fillCircle(game.width,0,30);
	// 		g.fillStyle('black');
	// 		next(g);
	// 	}
	// 	function disable() {
	// 		clearTimeout(timeout);
	// 		g.chains.draw.remove(draw);
	// 	}
	// })();


  // Camera
  (function() {
    game.camera = new Vector(0,0);
    game.camera.zoom = 1;
    game.camera.PTM = 32;
    game.camera.screenToWorld = function(screenV,out) {
      var ptm = getPixelsPerMeter();
      out.x = screenV.x / ptm + game.camera.x;
      out.y = -(screenV.y / ptm - game.camera.y);
    };
    game.camera.worldToScreen = function(worldV,out) {
      var ptm = getPixelsPerMeter();
      out.x = (worldV.x - game.camera.x) * ptm;
      out.y = (worldV.y - game.camera.y) * ptm * -1;
    };

    function getPixelsPerMeter() {
      return game.camera.PTM/game.camera.zoom;
    }
    game.camera.reset = function() {
      var ptm = getPixelsPerMeter();
      var targetx = player.position.x-(game.width*0.5)/ptm;
      var targety = player.position.y+(game.height*0.5)/ptm;
      targetx += player.velocity.x * 10;
      targety += player.velocity.y * 10;
      game.camera.x = targetx;
      game.camera.y = targety;
    };
    var pattern;
    function drawCamera(g,next) {
      var ptm = getPixelsPerMeter();
      // if (!pattern) {
      //   pattern = g.context.createPattern(images.background,'repeat');
      // }

      var targetx = player.position.x-(game.width*0.5)/ptm;
      // var targety = player.position.y+game.height*0.5/ptm;
      var targety = player.position.y+(game.height*0.5)/ptm;


      targetx += player.velocity.x * 10;
      targety += player.velocity.y * 10;

      var x = game.camera.x = 0.8*game.camera.x + 0.2*targetx;
      var y = game.camera.y = 0.8*game.camera.y + 0.2*targety;

      // g.save();
      // g.context.translate(-x*ptm,y*ptm);
      // g.fillStyle(pattern);
      // g.fillRectangle(x*ptm,-y*ptm,game.width,game.height);
      // g.restore();

      g.save();
      g.context.scale(ptm,-ptm);
      g.context.lineWidth /= ptm;
      g.context.translate(-x,-y);
      next(g);
      g.restore();
    }
    g.chains.draw.camera = drawCamera;
    g.chains.draw.insertBefore(drawCamera,g.chains.draw.objects);
  })();

	// Collision
	(function() {
		var t = new Vector(0,0)
		var t2 = new Vector(0,0);

		g.objects.lists.collidable = g.objects.createIndexList('collidable');
		g.objects.lists.collide = g.objects.createIndexList('collide');

		g.chains.update.insertAfter(function(dt,next) {
			handleCollision();
			next(dt);
		},g.chains.update.objects);

		function handleCollision() {
			g.objects.lists.collide.each(function(o) {
				if (!o.velocity){return;}
				o.surface = null;
				while(true) {
					var collisions = [];
					function handleCollisionLineSegments(lineSegments) {
						for(var i=0;i<lineSegments.length;i++) {
							var lineSegment = lineSegments[i];
							t.setV(lineSegment.normal);
							t.normalRight();
							var l = lineSegment.start.distanceToV(lineSegment.end);
							t2.setV(o.position);
							t2.substractV(lineSegment.start);
							var offY = lineSegment.normal.dotV(t2)-o.collisionRadius;
							var offX = t.dotV(t2);
							if (offY < -o.collisionRadius*2) {
								continue;
							} else if (offY < 0) {
								if (offX > 0 && offX < l) {
									offY*=-1;
									collisions.push({
										normalx:lineSegment.normal.x,
										normaly:lineSegment.normal.y,
										offset:offY
									});
								} else if (offX < 0 && offX > -o.collisionRadius) {
									var d = o.position.distanceToV(lineSegment.start);
									if (d < o.collisionRadius) {
										t.setV(o.position);
										t.substractV(lineSegment.start);
										t.normalize();
										collisions.push({
											normalx:t.x,
											normaly:t.y,
											offset:o.collisionRadius-d
										});
									}
								} else if (offX > l && offX < l+o.collisionRadius) {
									var d = o.position.distanceToV(lineSegment.end);
									if (d < o.collisionRadius) {
										t.setV(o.position);
										t.substractV(lineSegment.end);
										t.normalize();
										collisions.push({
											normalx:t.x,
											normaly:t.y,
											offset:o.collisionRadius-d
										});
									}
								}
							} else {
								continue;
							}
						}
					}
					g.objects.lists.collidable.each(function(collidable) {
						handleCollisionLineSegments(collidable.collisionlines);
					});
					if (collisions.length > 0) {
						collisions.sort(function(a,b) {
							return b.offset-a.offset;
						});
						var c = collisions[0];
						o.position.add(c.normalx*(c.offset+1),c.normaly*(c.offset+1));
						var vc = o.velocity.dot(c.normalx, c.normaly);
						o.velocity.substract(c.normalx*vc, c.normaly*vc);
						o.surface = c;
						if (o.collided) { o.collided(c); }
					} else {
						break;
					}
				}
			});
		}
	}());

 	// Tracing
	(function() {
		var t = new Vector(0,0);

		function IsOnSegment(xi, yi, xj, yj, xk, yk) {
			return	(xi <= xk || xj <= xk) && (xk <= xi || xk <= xj) &&
					(yi <= yk || yj <= yk) && (yk <= yi || yk <= yj);
		}

		function ComputeDirection(xi, yi, xj, yj, xk, yk) {
			var a = (xk - xi) * (yj - yi);
			var b = (xj - xi) * (yk - yi);
			return a < b ? -1 : a > b ? 1 : 0;
		}

		// From: http://ptspts.blogspot.nl/2010/06/how-to-determine-if-two-line-segments.html
		function DoLineSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
			var d1 = ComputeDirection(x3, y3, x4, y4, x1, y1);
			var d2 = ComputeDirection(x3, y3, x4, y4, x2, y2);
			var d3 = ComputeDirection(x1, y1, x2, y2, x3, y3);
			var d4 = ComputeDirection(x1, y1, x2, y2, x4, y4);
			return (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
					((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) ||
					(d1 == 0 && IsOnSegment(x3, y3, x4, y4, x1, y1)) ||
					(d2 == 0 && IsOnSegment(x3, y3, x4, y4, x2, y2)) ||
					(d3 == 0 && IsOnSegment(x1, y1, x2, y2, x3, y3)) ||
					(d4 == 0 && IsOnSegment(x1, y1, x2, y2, x4, y4));
		}

		// From: http://www.ahristov.com/tutorial/geometry-games/intersection-lines.html
		function intersection(x1,y1,x2,y2, x3,y3,x4,y4, result) {
			var d = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
			if (d == 0) return false;

			var xi = ((x3-x4)*(x1*y2-y1*x2)-(x1-x2)*(x3*y4-y3*x4))/d;
			var yi = ((y3-y4)*(x1*y2-y1*x2)-(y1-y2)*(x3*y4-y3*x4))/d;

			result.set(xi,yi);
			return true;
		}

		g.cantrace = function(fromx,fromy,tox,toy) {
			var result = true;
			game.objects.lists.collidable.each(function(collidable,BREAK) {
				for(var i=0;i<collidable.collisionlines.length;i++) {
					var cl = collidable.collisionlines[i];
					var fd = cl.normal.dot(fromx-tox,fromy-toy);

					// Is collision in right direction (toward fromxy)
					if (fd < 0) { continue; }

					// Are line-segments intersecting?
					if (!DoLineSegmentsIntersect(
						fromx,fromy,tox,toy,
						cl.start.x,cl.start.y,cl.end.x,cl.end.y
						)) { continue; }

					result = false;
					return BREAK;
				}
			});
			return result;
		};

		g.trace = function(fromx,fromy,tox,toy) {
			var c = null;
			game.objects.lists.collidable.each(function(collidable) {
				for(var i=0;i<collidable.collisionlines.length;i++) {
					var fd = cl.normal.dot(fromx-tox,fromy-toy);

					// Is collision in right direction (toward fromxy)
					if (fd < 0) { return; }

					// Are line-segments intersecting?
					if (!DoLineSegmentsIntersect(
						fromx,fromy,tox,toy,
						cl.start.x,cl.start.y,cl.end.x,cl.end.y
						)) { return; }

					// Get intersection
					if (!intersection(fromx,fromy,tox,toy, cl.start.x,cl.start.y,cl.end.x,cl.end.y, t)) {
						return;
					}

					// Determine the closest intersecting collisionline
					var distance = t.distanceTo(fromx,fromy);
					if (!c || c.distance > distance) {
						c = { collidable: collidable, cl: cl, distance: distance, x: t.x, y: t.y };
					}
				}
			});
			return c;
		}
	})();

  // Foreground and background
  (function() {
    var game = g;
    game.chains.draw.push(function(g,next) {
      game.objects.lists.background.each(function(o) {
        o.drawBackground(g);
      });
      game.objects.lists.shadow.each(function(o) {
        o.drawShadow(g);
      });
      game.objects.lists.foreground.each(function(o) {
        o.drawForeground(g);
      });
      // game.objects.lists.drawItem.each(function(o) {
      //  o.drawItem(g);
      // });
      next(g);
    });
  })();

	// Touching
	(function() {
		g.objects.lists.touchable = g.objects.createIndexList('touchable');
		g.chains.update.push(function(dt,next) {
			g.objects.lists.touchable.each(function(ta) {
				g.objects.lists.touchable.each(function(tb) {
					if (ta.position.distanceToV(tb.position) <= ta.touchRadius+tb.touchRadius) {
						if (ta.touch) { ta.touch(tb); }
					}
				});
			});
			next(dt);		
		});
	})();


	// Sea
	(function() {
		g.chains.draw.insertBefore(draw,g.chains.draw.objects);
		function draw(g,next) {
			next(g);
			game.objects.lists.overlay.each(function(o) {
				o.drawForeground(g);
			});
		}
	})();

	//#gameobjects
	function circleFiller(r) {
		return function(g) {
			g.fillCircle(this.position.x,this.position.y,r);
		};
	}
	function slide(a,b) { return (a?0:1)-(b?0:1); }

	// Player
	function Player() {
		this.position = new Vector(0,0);
		this.velocity = new Vector(0,0);
		this.angle = 0;
		this.touchRadius = this.radius = 1;
		this.maxoxygen = this.oxygen = 8;
		this.score = 0;
		this.level = 1;
	}
	(function(p) {
		p.updatable = true;
		p.touchable = true;
		p.foreground = true;
		p.die = function() {
			game.changeState(diedState());
		};
		p.update = function(dt) {
			var me = this;
			
			t.set(1,0);
			t.rotate(this.angle);

			// Calculate new oxygen.
			if (this.inWater()) {
				this.oxygen = Math.max(0, this.oxygen - dt*1);
				if (this.oxygen === 0) {
					this.die();
				}
			} else {
				this.oxygen = Math.min(this.maxoxygen, this.oxygen + dt*5);
			}

			// Calculate new angle.
			g.camera.screenToWorld(g.mouse,t2);
			t2.substractV(this.position);
			t2.normalizeOr(0,0);

			var diffAngle = t.angleTowardV(t2);
			var rotationRate = Math.PI*2*dt;
			if (diffAngle > rotationRate) diffAngle = rotationRate;
			if (diffAngle < -rotationRate) diffAngle = -rotationRate;
			this.angle += diffAngle;

			// Calculate new velocity
			if (this.inWater()) {
				t2.setV(t);
				t2.multiply(0.03);
				this.velocity.addV(t2);

				var velocitySpeedForward = this.velocity.dotV(t);
				var velocityForward = new Vector();
				velocityForward.setV(t);
				velocityForward.multiply(velocitySpeedForward);

				t.normalRight();
				var velocitySpeedSideward = this.velocity.dotV(t);
				var velocitySideward = new Vector();
				velocitySideward.setV(t);
				velocitySideward.multiply(velocitySpeedSideward);

				velocityForward.multiply(0.95);
				velocitySideward.multiply(0.5);

				this.velocity.setV(velocityForward);
				this.velocity.addV(velocitySideward);
			} else {
				this.velocity.add(0,-1*dt);
			}

			// Calculate new position
			t.setV(this.velocity);
			this.position.addV(t);
		};
		p.drawForeground = function(g) {
			var me = this;

			if (this.inWater()) {
				g.fillStyle('#ff0000');
			} else {
				g.fillStyle('#aa0000');
			}
			var flipVertical = Math.cos(this.angle) > 0;
			g.scalerotate(me.position.x,me.position.y,1/32*me.radius*0.3,(flipVertical?-1:1)*1/32*me.radius*0.3,me.angle,function() {
				g.drawCenteredImage(images.dolphin,me.position.x,me.position.y);
			});
		};
		p.nextScore = function() {
			return 5+Math.pow(5,this.level);
		};
		p.eats = function(level) {
			var score = Math.pow(3,this.level-1);
			this.score += score;
			var requiredScore = this.nextScore();
			if (this.score >= requiredScore) {
				this.level++;
				this.score -= requiredScore;
				this.touchRadius = this.radius = 0.5+this.level*0.2;
				this.maxoxygen = this.level*8;
			}
		};
		p.inWater = function() {
			return this.position.y < 0;
		};
	})(Player.prototype);

	function Particle(x,y) {
		this.position = new Vector(x,y);
	}
	(function(p) {
		p.foreground = true;
		p.drawForeground = function(g) {
			g.fillStyle('white');
			g.fillCircle(this.position.x,this.position.y,0.1);
		};
	})(Particle.prototype);


	function AirPocket(x,y) {
		this.position = new Vector(x,y);
		this.touchRadius = this.radius = 3;
	}
	(function(p) {
		p.foreground = true;
		p.touchable = true;
		p.drawForeground = function(g) {
			g.fillStyle('white');
			g.fillCircle(this.position.x,this.position.y,this.radius);
		};
		p.touch = function(p) {
			if (p === player) {
				player.oxygen = 5;
			}
		};
	})(AirPocket.prototype);

	function Fish(level,x,y,mapcell) {
		this.level = level;
		this.position = new Vector(x,y);
		this.velocity = new Vector(Math.rnd(),Math.rnd());
		this.mapcell = mapcell;
	}
	(function(p) {
		p.updatable = true;
		p.foreground = true;
		p.school = true;
		var averagePosition = new Vector(0,0);
		var averageVelocity = new Vector(0,0);
		var separation = new Vector(0,0);
		var newVelocity = new Vector(0,0);
		var desiredSeparation = 2;
		var schoolDistance = 3;
		p.eaten = function() {
				game.objects.remove(this);
				var i = this.mapcell.objects.indexOf(this);
				this.mapcell.objects.splice(i,1);
				console.log(this.mapcell.id, this.mapcell.objects.length);
				player.eats(this.level);
		};
		p.update = function(dt) {
			var me = this;


			if (this.position.distanceToV(player.position) < (player.touchRadius+0.5)) {
				this.eaten();
				return;
			}

			averagePosition.set(0,0);
			averageVelocity.set(0,0);
			separation.set(0,0);
			var count = 0;
			game.objects.lists.school.each(function(fish) {
				if (fish === me) { return; }
				var d = fish.position.distanceToV(me.position);
				if (d > schoolDistance) { return; }
				averagePosition.addV(fish.position);
				averageVelocity.addV(fish.velocity);

				if (d < desiredSeparation) {
					t.setV(me.position);
					t.substractV(fish.position);
					var d = t.length();
					t.normalizeOr(0,0);
					if (d > 0) {
						t.divide(d / desiredSeparation);
						separation.addV(t);
					}
				}

				count++;
			});
			if (count > 0) {
				averagePosition.divide(count);
				averageVelocity.divide(count);
				separation.divide(count);
			}
			averagePosition.substractV(this.position);

			averagePosition.multiply(0.5);
			averageVelocity.multiply(0.3);
			separation.multiply(5);

			newVelocity.set(0,0);
			newVelocity.addV(averagePosition);
			newVelocity.addV(averageVelocity);
			newVelocity.addV(separation);
			// newVelocity.multiply(1/3.0);

			// Stay in mapcell
			t.set(this.mapcell.left+cellSize*0.5,this.mapcell.top+cellSize*0.5);
			t.substractV(this.position);
			t.multiply(1);
			newVelocity.addV(t);

			// Avoid player
			var avoidDistance = 5;
			t.setV(player.position);
			t.substractV(this.position);
			var d = t.length();
			if (d < avoidDistance) {
				t.normalizeOr(1,0);
				t.multiply(avoidDistance - d);
				t.multiply(-12);
				newVelocity.addV(t);
			}


			// Smoothing
			var damping = 0.9;
			me.velocity.set(
				me.velocity.x*damping+newVelocity.x*(1-damping),
				me.velocity.y*damping+newVelocity.y*(1-damping)
			);

			// Minimum/Maximum speed
			var speed = Math.min(80,Math.max(10,me.velocity.length()));
			me.velocity.normalizeOr(0,0);
			me.velocity.multiply(speed);

			// Damping
			me.velocity.multiply(0.95);

			if (me.position.y > 0) {
				me.velocity.y -= 10;
			}

			t.setV(me.velocity);
			t.multiply(dt);
			me.position.addV(t);
		};
		p.drawForeground = function(g) {
			var me = this;
			var scale = 0.5+me.level*0.5;
			g.scalerotate(me.position.x,me.position.y,1/32*scale,(me.velocity.y>0?-1:1)*1/32*scale,me.velocity.angle(),function() {
				g.drawCenteredImage(images.fish01,me.position.x,me.position.y);
			});
		};
	})(Fish.prototype);

	// World generation
	var cellSize = 32;
	(function() {
		var grid = {};
		var previouslyRelevantCells = [];
		function update(dt,next) {
			var gridx = Math.floor(player.position.x / cellSize);
			var gridy = Math.floor(player.position.y / cellSize);

			var relevantCells = [
				(gridx-1)+'x'+(gridy-1),
				(gridx+0)+'x'+(gridy-1),
				(gridx+1)+'x'+(gridy-1),
				(gridx-1)+'x'+(gridy+0),
				(gridx+0)+'x'+(gridy+0),
				(gridx+1)+'x'+(gridy+0),
				(gridx-1)+'x'+(gridy+1),
				(gridx+0)+'x'+(gridy+1),
				(gridx+1)+'x'+(gridy+1)
			];

			relevantCells.forEach(ensureCell);

			previouslyRelevantCells.filter(function(cell) {
				return relevantCells.indexOf(cell) === -1;
			}).forEach(disposeCell);

			previouslyRelevantCells = relevantCells;
		}

		function ensureCell(cell) {
			if (grid[cell]) { return; }
			createCell(cell);
		}
		function createCell(cell) {
			console.log('Creating',cell);
			var s = cell.split('x');
			var gridx = parseInt(s[0],10);
			var gridy = parseInt(s[1],10);

			var cellTypes = gridy >= 0 ? landCellTypes : waterCellTypes;

			var seed = cantorPair(gridx,gridy);
			var r = new SeedableRandom(seed);
			var CellType = cellTypes[Math.abs(gridx+gridy) % cellTypes.length];

			grid[cell] = new CellType(gridx,gridy);
			game.objects.add(grid[cell]);
			grid[cell].create();
		}
		function disposeCell(cell) {
			console.log('Disposing',cell);
			game.objects.remove(grid[cell]);
			grid[cell].dispose();
			delete grid[cell];
		}
		g.chains.update.push(update);


		var landCellTypes = [
			SurfaceCell
		];
		var waterCellTypes = [
			CreatureCell,
			EmptyCell,
			EmptyCell,
			// ParticleCell,
			// AirPocketCell,
			// BoundsCell
		];


	})();

	var mapCellData = {};
	function MapCell(x,y) {
		this.x = x;
		this.y = y;
		this.id = x+'x'+y;
		this.data = mapCellData[this.id];
		this.left = x*cellSize;
		this.top = y*cellSize;
		this.right = this.left+cellSize;
		this.bottom = this.top+cellSize;
		this.seed = cantorPair(x,y);
		this.objects = [];

		if (this.y === 0) {
			this.overlay = true;
		}
	}
	(function(p) {
		p.background = true;
		p.dispose = function() {
			this.objects.forEach(function(obj) {
				game.objects.remove(obj);
			});
			this.objects = [];
		};
		p.add = function(obj) {
			this.objects.push(obj);
			game.objects.add(obj);
		};
		p.drawForeground = function(g) {
			var me = this;
			g.scale(me.left,me.top,1/2,-1/2,function() {
				g.drawImage(images.surface,
					me.left,me.top,
					me.right-me.left,me.bottom-me.top
				);

				g.drawImage(images.surface,
					me.left+(me.right-me.left),me.top,
					me.right-me.left,me.bottom-me.top
				);
			});
		};
		p.drawBackground = function(g) {
			g.fillStyle('#0fb0fe');
			g.fillRectangle(
				this.left,this.top,
				this.right-this.left+1,
				this.bottom-this.top+(1/32)
			);
			g.drawImage(images.background,
				this.left,this.top,
				this.right-this.left+1,
				this.bottom-this.top+(1/32)
			);
		};
	})(MapCell.prototype);

	function CreatureCell(x,y) {
		MapCell.apply(this,arguments);
	}
	CreatureCell.prototype = new MapCell();
	CreatureCell.prototype.create = function() {
		if (this.y >= 0) { return; }
		var count = mapCellData[this.id] === undefined ? 10 : mapCellData[this.id];
		var r = new SeedableRandom(this.seed);
		for(var i=0;i<count;i++) {
			var level = Math.floor(-this.y / 3) + 1;
			this.add(new Fish(
				level,
				this.left+cellSize*0.5, this.top+cellSize*0.5,
				this
			));
		}
	};
	CreatureCell.prototype.dispose = function() {
		mapCellData[this.id] = this.objects.length;
		console.log(this.id,this.objects.length);
		MapCell.prototype.dispose.call(this);
	};

	function ParticleCell(x,y) {
		MapCell.apply(this,arguments);
	}
	ParticleCell.prototype = new MapCell();
	ParticleCell.prototype.create = function() {
		var r = new SeedableRandom(this.seed);
		for(var i=0;i<10;i++) {
			this.add(new Particle(this.left+r.next()*cellSize,this.top+r.next()*cellSize));
		}
	};

	function BoundsCell(x,y) {
		MapCell.apply(this,arguments);
	}
	BoundsCell.prototype = new MapCell();
	BoundsCell.prototype.create = function() {
		if (this.y < 0) {
			this.add(new Particle(this.left,this.top));
			this.add(new Particle(this.right,this.top));
			this.add(new Particle(this.left,this.bottom));
			this.add(new Particle(this.right,this.bottom));
		}
	};

	function EmptyCell(x,y) {
		MapCell.apply(this,arguments);
	}
	EmptyCell.prototype = new MapCell();
	EmptyCell.prototype.create = function() {};

	function SurfaceCell(x,y) {
		MapCell.apply(this,arguments);
	}
	SurfaceCell.prototype = new MapCell();
	SurfaceCell.prototype.create = function() {};
	SurfaceCell.prototype.drawBackground = function(g) {
		g.drawImage(images.land,
			this.left,this.top,
			this.right-this.left+1,
			this.bottom-this.top+(1/32)
		);
	};


	function AirPocketCell(x,y) {
		MapCell.apply(this,arguments);
	}
	AirPocketCell.prototype = new MapCell();
	AirPocketCell.prototype.create = function() {
		if (this.y < 0) {
			this.add(new AirPocket((this.left+this.right)*0.5,(this.top+this.bottom)*0.5));
		}
	};


	//#states
	function gameplayState() {
		var me = {
			enabled: false,
			enable: enable,
			disable: disable
		};
		function enable() {
			g.chains.update.push(update);
			g.chains.draw.insertBefore(draw, g.chains.draw.camera);
			g.on('mousedown',mousedown);
		}
		function disable() {
			g.chains.update.remove(update);
			g.chains.draw.remove(draw);
			g.removeListener('mousedown',mousedown);
		}

		function update(dt,next) {
			// Post update
			next(dt);
		}
		function draw(g,next) {
			// Draw HUD
			next(g);
			drawHUD(g);
		}
		function mousedown(button) {
		}
		return me;
	}

	function drawHUD(g) {
			g.translate(20,20,function() {
				// Draw oxygen
				drawProgress(g,player.oxygen,player.maxoxygen);
			});

			// Draw food
			var scale = player.score / player.nextScore();
			g.fillStyle('white');
			g.fillRectangle(game.width*0.6,0,(game.width*0.35)*scale,20);
			g.strokeStyle('white');
			g.strokeRectangle(game.width*0.6,0,game.width*0.35,20);

			// Draw level
			g.context.font = '14px Arial';
			g.fillCenteredText('Level '+player.level,game.width*0.5,20);
	}

	function createHighlightMask(x,y,radius) {
		var mask = document.createElement('canvas');
		mask.width = game.width;
		mask.height = game.height;
		var ctx = mask.getContext('2d');
		ctx.fillStyle = 'black';
		ctx.fillRect(0,0,game.width,game.height);
		ctx.globalCompositeOperation = 'xor';
		ctx.arc(x,y,radius,0,2*Math.PI);
		ctx.fill();
		return mask;
	}



	function step1State() {
		var me = {
			enabled: false,
			enable: enable,
			disable: disable
		};
		function enable() {
			g.chains.update.unshift(update);
			g.chains.draw.insertBefore(draw, g.chains.draw.camera);
			g.on('mousedown',mousedown);
		}
		function disable() {
			g.chains.update.remove(update);
			g.chains.draw.remove(draw);
			g.removeListener('mousedown',mousedown);
		}
		var highlight = createHighlightMask(game.width*0.5,game.height*0.5,200);
		function draw(g,next) {
			next(g);
			// g.drawCenteredImage(highlight,game.width*0.5,game.height*0.5);
			g.context.font = '30px arial';
			g.fillStyle('white');
			g.fillCenteredText('This is you',game.width*0.5,game.height*0.4);
			g.fillCenteredText('Click to continue',game.width*0.5,game.height*0.8);
		}
		function update(dt,next) {
		}
		function mousedown() {
			game.changeState(step1bState());
		}
		return me;
	}

	function step1bState() {
		var me = {
			enabled: false,
			enable: enable,
			disable: disable
		};
		function enable() {
			g.chains.update.unshift(update);
			g.chains.draw.insertBefore(draw, g.chains.draw.camera);
			g.on('mousedown',mousedown);
		}
		function disable() {
			g.chains.update.remove(update);
			g.chains.draw.remove(draw);
			g.removeListener('mousedown',mousedown);
		}
		var highlight = createHighlightMask(game.width*0.5,game.height*0.5,200);
		function draw(g,next) {
			next(g);
			// g.drawCenteredImage(highlight,game.width*0.5,game.height*0.5);
			g.context.font = '30px arial';
			g.fillStyle('white');
			g.fillCenteredText('Aren\'t you the cutest?',game.width*0.5,game.height*0.4);
			g.fillCenteredText('Click to continue',game.width*0.5,game.height*0.8);
		}
		function update(dt,next) {
		}
		function mousedown() {
			game.changeState(step2State());
		}
		return me;
	}

	function step2State() {
		var me = {
			enabled: false,
			enable: enable,
			disable: disable
		};
		function enable() {
			g.chains.update.unshift(update);
			g.chains.draw.insertBefore(draw, g.chains.draw.camera);
			g.on('mousedown',mousedown);
		}
		function disable() {
			g.chains.update.remove(update);
			g.chains.draw.remove(draw);
			g.removeListener('mousedown',mousedown);
		}
		var highlight = createHighlightMask(game.width*0.5,game.height*0.5,200);
		function draw(g,next) {
			next(g);
			// g.drawCenteredImage(highlight,game.width*0.5,game.height*0.5);
			g.context.font = '30px arial';
			g.fillStyle('white');
			g.fillCenteredText('You\'re also a great swimmer',game.width*0.5,game.height*0.3);
			g.fillCenteredText('(using your mouse)',game.width*0.5,game.height*0.4);
			g.fillCenteredText('Click to continue',game.width*0.5,game.height*0.8);
		}
		var updated = false;
		function update(dt,next) {
			if (updated) { return; }
			next(dt);
			game.objects.handlePending();
			updated = true;
		}
		function mousedown() {
			game.changeState(step3State());
		}
		return me;
	}

	function step3State() {
		var me = {
			enabled: false,
			enable: enable,
			disable: disable
		};
		function enable() {
			g.chains.update.unshift(update);
			g.chains.draw.insertBefore(draw, g.chains.draw.camera);
		}
		function disable() {
			g.chains.update.remove(update);
			g.chains.draw.remove(draw);
		}
		function draw(g,next) {
			next(g);
			drawHUD(g);
		}
		var time = 2;
		function update(dt,next) {
			next(dt);
			time -= dt;
			console.log(time);
			if (time <= 0) {
				game.changeState(step4State());
			}
		}
		return me;
	}

	function step4State() {
		var me = {
			enabled: false,
			enable: enable,
			disable: disable
		};
		function enable() {
			g.chains.update.unshift(update);
			g.chains.draw.insertBefore(draw, g.chains.draw.camera);
			g.on('mousedown',mousedown);
		}
		function disable() {
			g.chains.update.remove(update);
			g.chains.draw.remove(draw);
			g.removeListener('mousedown',mousedown);
		}
		var highlight = createHighlightMask(game.width*0.05,game.height*0.05,100);
		function draw(g,next) {
			next(g);
			drawHUD(g);
			g.context.globalAlpha = 0.3;
			g.drawCenteredImage(highlight,game.width*0.5,game.height*0.5);
			g.context.globalAlpha = 1;
			g.context.font = '30px arial';
			g.fillStyle('white');
			g.fillCenteredText('... but you need oxygen from the surface',game.width*0.5,game.height*0.3);
			g.fillCenteredText('Click to continue',game.width*0.5,game.height*0.8);
		}
		function update(dt,next) {
			// next(dt);
		}
		function mousedown() {
			game.changeState(step4bState());
		}
		return me;
	}

	function step4bState() {
		var me = {
			enabled: false,
			enable: enable,
			disable: disable
		};
		function enable() {
			g.chains.update.unshift(update);
			g.chains.draw.insertBefore(draw, g.chains.draw.camera);
		}
		function disable() {
			g.chains.update.remove(update);
			g.chains.draw.remove(draw);
		}
		function draw(g,next) {
			next(g);
			drawHUD(g);
		}
		function update(dt,next) {
			next(dt);
			if (player.oxygen >= 7 && !player.inWater()) {
				game.changeState(step5State());
			}
		}
		return me;
	}

	function step5State() {
		var me = {
			enabled: false,
			enable: enable,
			disable: disable
		};
		function enable() {
			g.chains.update.unshift(update);
			g.chains.draw.insertBefore(draw, g.chains.draw.camera);
			g.on('mousedown',mousedown);
		}
		function disable() {
			g.chains.update.remove(update);
			g.chains.draw.remove(draw);
			g.removeListener('mousedown',mousedown);
		}
		var highlight = createHighlightMask(game.width*0.63,game.height*0.03,80);
		function draw(g,next) {
			next(g);
			drawHUD(g);
			g.context.globalAlpha = 0.3;
			g.drawCenteredImage(highlight,game.width*0.5,game.height*0.5);
			g.context.globalAlpha = 1;
			g.context.font = '30px arial';
			g.fillStyle('white');
			g.fillCenteredText('... and you like food...',game.width*0.5,game.height*0.3);
			g.fillCenteredText('Click to continue',game.width*0.5,game.height*0.8);
		}
		function update(dt,next) {
			// next(dt);
		}
		function mousedown() {
			game.changeState(step6State());
		}
		return me;
	}

	function step6State() {
		var me = {
			enabled: false,
			enable: enable,
			disable: disable
		};
		function enable() {
			g.chains.update.unshift(update);
			g.chains.draw.insertBefore(draw, g.chains.draw.camera);
			g.on('mousedown',mousedown);
		}
		function disable() {
			g.chains.update.remove(update);
			g.chains.draw.remove(draw);
			g.removeListener('mousedown',mousedown);
		}
		function draw(g,next) {
			next(g);
			drawHUD(g);
		}
		function update(dt,next) {
			if (player.level === 1) {
				next(dt);
			} else {
				game.changeState(step7State());
			}
		}
		function mousedown() {
			// game.changeState(step6State());
		}
		return me;
	}

	function step7State() {
		var me = {
			enabled: false,
			enable: enable,
			disable: disable
		};
		function enable() {
			g.chains.update.unshift(update);
			g.chains.draw.insertBefore(draw, g.chains.draw.camera);
			g.on('mousedown',mousedown);
		}
		function disable() {
			g.chains.update.remove(update);
			g.chains.draw.remove(draw);
			g.removeListener('mousedown',mousedown);
		}
		var highlight = createHighlightMask(game.width*0.5,game.height*0.05,80);
		function draw(g,next) {
			next(g);
			drawHUD(g);
			g.context.globalAlpha = 0.3;
			g.drawCenteredImage(highlight,game.width*0.5,game.height*0.5);
			g.context.globalAlpha = 1;
			g.context.font = '30px arial';
			g.fillStyle('white');
			g.fillCenteredText('You just grew to level 2!',game.width*0.5,game.height*0.3);
			g.fillCenteredText('Click to continue',game.width*0.5,game.height*0.8);
		}
		function update(dt,next) {
			// next(dt);
		}
		function mousedown() {
			game.changeState(step8State());
		}
		return me;
	}

	function step8State() {
		var me = {
			enabled: false,
			enable: enable,
			disable: disable
		};
		function enable() {
			g.chains.update.unshift(update);
			g.chains.draw.insertBefore(draw, g.chains.draw.camera);
			g.on('mousedown',mousedown);
		}
		function disable() {
			g.chains.update.remove(update);
			g.chains.draw.remove(draw);
			g.removeListener('mousedown',mousedown);
		}
		var highlight = createHighlightMask(game.width*0.05,game.height*0.05,100);
		function draw(g,next) {
			next(g);
			drawHUD(g);
			g.context.globalAlpha = 0.3;
			g.drawCenteredImage(highlight,game.width*0.5,game.height*0.5);
			g.context.globalAlpha = 1;
			g.context.font = '30px arial';
			g.fillStyle('white');
			g.fillCenteredText('... and your lungs have grown too.',game.width*0.5,game.height*0.3);
			g.fillCenteredText('so you can dive to greater depths!',game.width*0.5,game.height*0.4);
			g.fillCenteredText('Click to continue',game.width*0.5,game.height*0.8);
		}
		function update(dt,next) {
			// next(dt);
		}
		function mousedown() {
			game.changeState(step9State());
		}
		return me;
	}

	function step9State() {
		var me = {
			enabled: false,
			enable: enable,
			disable: disable
		};
		function enable() {
			g.chains.update.unshift(update);
			g.chains.draw.insertBefore(draw, g.chains.draw.camera);
			g.on('mousedown',mousedown);
		}
		function disable() {
			g.chains.update.remove(update);
			g.chains.draw.remove(draw);
			g.removeListener('mousedown',mousedown);
		}
		function draw(g,next) {
			next(g);
			drawHUD(g);
			g.context.font = '30px arial';
			g.fillStyle('white');
			g.fillCenteredText('Have fun!',game.width*0.5,game.height*0.3);
			g.fillCenteredText('Click to continue',game.width*0.5,game.height*0.8);
		}
		function update(dt,next) {
			// next(dt);
		}
		function mousedown() {
			game.changeState(gameplayState());
		}
		return me;
	}

	function diedState() {
		var me = {
			enabled: false,
			enable: enable,
			disable: disable
		};
		function enable() {
			g.chains.update.unshift(update);
			g.chains.draw.insertBefore(draw, g.chains.draw.camera);
			g.on('mousedown',mousedown);
		}
		function disable() {
			g.chains.update.remove(update);
			g.chains.draw.remove(draw);
			g.removeListener('mousedown',mousedown);
		}
		function draw(g,next) {
			next(g);
			g.fillStyle('rgba(0,0,0,0.5)');
			g.fillRectangle(0,0,game.width,game.height);
			g.context.font = '30px arial';
			g.fillStyle('white');
			g.fillCenteredText('the world is a harsh place',game.width*0.5,game.height*0.2);
			g.fillCenteredText('You died',game.width*0.5,game.height*0.5);
			g.fillCenteredText('due to lack of oxygen',game.width*0.5,game.height*0.5+50);
		}
		function update(dt,next) {
			// next(dt);
		}
		function mousedown() {
			window.location.reload();
		}
		return me;
	}

	function drawProgress(g,amount,max) {
		var size = 64;
		var maxCeil = Math.ceil(max);
		var columns = Math.ceil(Math.sqrt(max));
		g.scale(0,0,0.5,0.5,function() {
			g.strokeStyle('white');
			g.fillStyle('white');
			for(var i=0;i<maxCeil;i++) {
				var x = Math.floor(i / columns);
				var y = i % columns;

				var scale;
				scale = Math.max(0,Math.min(1,max - i));
				g.strokeCircle(x*size,y*size,size*0.5);
				scale = Math.max(0,Math.min(1,amount - i));
				g.scale(x*size,y*size,scale,scale,function() {
					g.drawCenteredImage(images.bubble,x*size,y*size);
				});
			}
		});
	}

	var player;
	g.on('levelchanged',function() {
		player = new Player();
		player.position.set(0,0);
		g.objects.add(player);
	});
	g.chains.draw.insertBefore(function(g,next) {
		next(g);
	},g.chains.draw.objects);

	g.on('levelunloaded',function() {
		g.objects.clear();
		g.objects.handlePending();
	});

	g.changeLevel(testlevel());

	function flatten(arr) {
		var r = [];
		for(var i=0;i<arr.length;i++) {
			if (arr[i].length !== undefined) {
				r = r.concat(flatten(arr[i]));
			} else {
				r.push(arr[i]);
			}
		}
		return r;
	}

	function pathway(x,y,w,h) {
		var r = [];
		for(var xx=x;xx<x+w;xx+=50) {
			for(var yy=y;yy<y+h;yy+=50) {
				r.push(new ColoredRectangle(xx,yy,50,50,((xx/50+yy/50)%2 === 0) ? white : black));
			}
		}
		return r;
	}
	//#levels
	function testlevel() {
		return {
			name: 'Test',
			objects:
				flatten(
				[]),
			clone: arguments.callee,
			nextLevel: null
		};
	}

	g.changeState(step1State());

	game.objects.handlePending();
	game.camera.reset();

	g.start();
	}



function SeedableRandom(seed) {
	// seed with the current time by default
	/** The last value the random number generator was seeded with. */
	this.last_seed = null;
	
	/**
		Get the next random number between 0 and 1 in the current sequence.
	*/
	this.next = function next() {
		// Random number generator using George Marsaglia's MWC algorithm.
		// Got this from the v8 js engine
		
		// don't let them get stuck
		if (this.x == 0) this.x = -1;
		if (this.y == 0) this.y = -1;
		
		// Mix the bits.
		this.x = this.nextX();
		this.y = this.nextY();
		return ((this.x << 16) + (this.y & 0xFFFF)) / 0xFFFFFFFF + 0.5;
	}
	
	/**
		@description Alias for next();
	*/
	this.random = this.next;
	
	this.nextX = function() {
		return 36969 * (this.x & 0xFFFF) + (this.x >> 16);
	}
	
	this.nextY = function() {
		return 18273 * (this.y & 0xFFFF) + (this.y >> 16);
	}
	
	/**
		Get the next random integer in the current sequence.
		@param a The lower bound of integers (inclusive).
		@param gs The upper bound of integers (exclusive).
	*/
	this.nextInt = function nextInt(a, b) {
		if (!b) {
			a = 0;
			b = 0xFFFFFFFF;
		}
		// fetch an integer between a and b inclusive
		return Math.floor(this.next() * (b - a)) + a;
	}
	
	/**
		Seed the random number generator. The same seed will always yield the same sequence. Seed with the current time if you want it to vary each time.
		@param x The seed.
	*/
	this.seed = function(x) {
		this.last_seed = x;
		this.x = x * 3253;
		this.y = this.nextX();
	}
	
	/**
		Seed the random number generator with a two dimensional seed.
		@param x First seed.
		@param y Second seed.
	*/
	this.seed2d = function seed(x, y) {
		this.last_seed = [x, y];
		this.x = x * 2549 + y * 3571;
		this.y = y * 2549 + x * 3571;
	}
	
	/**
		Seed the random number generator with a three dimensional seed.
		@param x First seed.
		@param y Second seed.
		@param z Third seed.
	*/
	this.seed3d = function seed(x, y, z) {
		this.last_seed = [x, y, z];
		this.x = x * 2549 + y * 3571 + z * 3253;
		this.y = x * 3253 + y * 2549 + z * 3571;
	}
	
	// seed the generator with the seed we were passed, or the time as a last resort
	this.seed(seed == null ? (new Date()).getTime() : seed);
}

function cantorPair(a,b) {
	var r = 0.5*(a+b)*(a+b+1)+b;
	if (r >= 0) { return r*2; }
	else { return -r*2-1; }
}
});
