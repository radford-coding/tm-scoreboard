/*
 * Yes, this code isn't great, but it's small and works even in IE10.
 * I wasn't configuring babel/webpack for a one off fun project.
 */

(function () {
	var contestants = [];
	var nextContestantId = 0;

	var locked = false;
	var roundCount = 0;
	var roundLabels = [];

	var pointGainMinSize = 40;
	var pointGainMaxSize = 84;

	var main = document.querySelector("main");
	var fileInput = document.querySelector("#file-input");
	var playButton = document.querySelector("#play-button");
	var tableContainer = document.querySelector("#score-table-container");
	var tableIndicator = document.querySelector("#score-table-indicator");

	function addContestant(image) {
		var contestant = {};

		contestant.image = !!image ? image : "./images/blank.jpg";
		contestant.name = getNameFromImage(contestant.image);
		contestant.roundScores = [];
		contestant.score = 0;
		contestant.oldScore = 0;
		contestant.originalIndex = nextContestantId++;

		for (var i = 0; i < roundCount; i++) {
			contestant.roundScores.push(0);
		}

		contestants.push(contestant);

		return contestants.length;
	}

	function getNameFromImage(image) {
		if (!image) return "Contestant " + (contestants.length + 1);
		var parts = image.split("/");
		var filename = parts[parts.length - 1];
		return filename.replace(/\.[^/.]+$/, "");
	}

	// function removeContestant(idx) {
	// 	contestants.splice(idx, 1);
	// }

	function getCumulative(con) {
		var total = 0;
		for (var i = 0; i < con.roundScores.length; i++) {
			total += con.roundScores[i];
		}
		return total;
	}

	function createContestantEl(con, id) {
		var el = document.createElement("div");
		el.classList.add("contestant");

		var frameScaler = document.createElement("div");
		frameScaler.classList.add("frame-scaler");

		var frameContainer = document.createElement("div");
		frameContainer.classList.add("frame-container");
		frameContainer.style.webkitAnimationDelay = -id * 1.25 + "s";
		frameContainer.style.animationDelay = -id * 1.25 + "s";

		var fill = document.createElement("div");
		fill.classList.add("fill");
		fill.style.backgroundImage = "url(" + con.image + ")";

		var shadow = document.createElement("div");
		shadow.classList.add("shadow");

		var frame = document.createElement("img");
		frame.src = "./images/frame.png";
		frame.classList.add("frame");
		frame.removeAttribute("width");
		frame.removeAttribute("height");

		frame.addEventListener("click", function () {
			var cb = function (evt) {
				if (fileInput.files && fileInput.files[0]) {
					con.image = URL.createObjectURL(fileInput.files[0]);
					fill.style.backgroundImage = "url(" + con.image + ")";
				}
				fileInput.removeEventListener("change", cb);
				fileInput.value = "";
			};

			fileInput.addEventListener("change", cb);
			fileInput.click();
		});

		var exit = document.createElement("button");
		// exit.classList.add("exit-button");
		// exit.innerText = "X";
		// exit.addEventListener("click", function() {
		// 	removeContestant(id - 1);
		// 	refreshContestants();
		// 	resize();
		// });

		fill.appendChild(shadow);
		frameContainer.appendChild(fill);
		frameContainer.appendChild(frame);

		if (!locked) frameContainer.appendChild(exit);

		frameScaler.appendChild(frameContainer);

		var scoreContainer = document.createElement("div");
		scoreContainer.classList.add("score-container");

		var seal = document.createElement("img");
		seal.classList.add("seal");
		seal.src = "./images/seal.png";
		seal.removeAttribute("width");
		seal.removeAttribute("height");

		var score = document.createElement("h1");
		score.classList.add("score");
		score.innerText = con.oldScore;

		scoreContainer.appendChild(seal);
		scoreContainer.appendChild(score);

		el.appendChild(frameScaler);
		el.appendChild(scoreContainer);

		return el;
	}

	function transformContestants() {

		contestants.sort(function (first, second) {
			if (first.score < second.score) {
				return -1;
			} else if (first.score > second.score) {
				return 1;
			} else {
				return 0;
			}
		});


		var maxScore = contestants[contestants.length - 1].score;
		var maxCount = 1;

		for (var i = contestants.length - 1; i > 0; --i) {
			var con = contestants[i - 1];
			if (con.score == maxScore) {
				++maxCount;
			}
		}

		for (var i = 0, l = contestants.length; i < l; ++i) {
			var con = contestants[i];

			con.el.style.msTransform = "translateX(" + (275 * i + 30) + "px)";
			con.el.style.transform = "translateX(" + (275 * i + 30) + "px)";

			if (con.score == maxScore) {
				if (maxCount > 2) {
					con.el.children[0].classList.remove("larger");
					con.el.children[0].classList.add("large");
				} else {
					con.el.children[0].classList.remove("large");
					con.el.children[0].classList.add("larger");
				}
			} else {
				con.el.children[0].classList.remove("large");
				con.el.children[0].classList.remove("larger");
			}
		}
	}

	function createAdd(len) {
		var res = document.createElement("button");

		res.innerText = "+";

		res.classList.add("add-button")

		res.style.msTransform = "translateX(" + (275 * len + 30) + "px)";
		res.style.transform = "translateX(" + (275 * len + 30) + "px)";

		res.addEventListener("click", function () {
			addContestant();
			refreshContestants();
			resize();
		});

		return res;
	}

	function rebuildScoreTable() {
		tableContainer.innerHTML = "";

		var toolbar = document.createElement("div");
		toolbar.id = "score-table-toolbar";

		var label = document.createElement("span");
		label.className = "score-table-label";
		label.innerText = "Scores";
		toolbar.appendChild(label);

		var addBtn = document.createElement("button");
		addBtn.className = "round-btn";
		addBtn.innerText = "+";
		addBtn.title = "Add round";
		addBtn.addEventListener("click", function () {
			roundCount++;
			roundLabels.push("task " + roundCount);
			for (var i = 0; i < contestants.length; i++) {
				contestants[i].roundScores.push(0);
			}
			rebuildScoreTable();
		});
		toolbar.appendChild(addBtn);

		var removeBtn = document.createElement("button");
		removeBtn.className = "round-btn";
		removeBtn.innerText = "-";
		removeBtn.title = "Remove last round";
		if (roundCount <= 0) removeBtn.style.display = "none";
		removeBtn.addEventListener("click", function () {
			if (roundCount <= 0) return;
			roundCount--;
			roundLabels.pop();
			for (var i = 0; i < contestants.length; i++) {
				contestants[i].roundScores.pop();
			}
			for (var i = 0; i < contestants.length; i++) {
				var total = getCumulative(contestants[i]);
				if (contestants[i].score != total) {
					contestants[i].score = total;
				}
			}
			rebuildScoreTable();
		});
		toolbar.appendChild(removeBtn);

		var toggleBtn = document.createElement("button");
		toggleBtn.className = "round-btn toggle-btn";
		toggleBtn.innerText = "Hide";
		toggleBtn.title = "Hide table";
		toggleBtn.addEventListener("click", function () {
			toggleTable();
		});
		toolbar.appendChild(toggleBtn);

		tableContainer.appendChild(toolbar);

		var table = document.createElement("table");
		table.id = "score-table";

		var thead = document.createElement("thead");
		var headerRow = document.createElement("tr");

		var th = document.createElement("th");
		th.className = "table-label";
		headerRow.appendChild(th);

		for (var r = 0; r < roundCount; r++) {
			(function (roundIdx) {
				var th = document.createElement("th");
				th.className = "table-round-header";
				th.innerText = roundLabels[roundIdx];
				th.contentEditable = true;
				th.addEventListener("blur", function () {
					roundLabels[roundIdx] = this.innerText.replace(/\u21BB/g, "");
				});

				var resetBtn = document.createElement("button");
				resetBtn.className = "round-reset-btn";
				resetBtn.innerText = "\u21BB";
				resetBtn.title = "Reset column scores";
				resetBtn.addEventListener("click", function (e) {
					e.stopPropagation();
					console.log("click");
					for (var i = 0; i < contestants.length; i++) {
						contestants[i].roundScores[roundIdx] = 0;
						contestants[i].score = getCumulative(contestants[i]);
					}
					rebuildScoreTable();
				});
				th.appendChild(resetBtn);

				headerRow.appendChild(th);
			})(r);
		}

		var th = document.createElement("th");
		th.className = "table-cumulative-header";
		th.innerText = "Total";
		headerRow.appendChild(th);

		thead.appendChild(headerRow);
		table.appendChild(thead);

		var sortedByOriginal = contestants.slice().sort(function (a, b) {
			return a.originalIndex - b.originalIndex;
		});

		var tbody = document.createElement("tbody");
		for (var i = 0; i < sortedByOriginal.length; i++) {
			var con = sortedByOriginal[i];
			var row = document.createElement("tr");

			var td = document.createElement("td");
			td.className = "table-label";
			td.innerText = con.name;
			row.appendChild(td);

			for (var r = 0; r < roundCount; r++) {
				(function (con, roundIdx) {
					var td = document.createElement("td");
					var input = document.createElement("input");
					input.type = "number";
					input.className = "table-score-input";
					input.setAttribute("data-row", i);
					input.setAttribute("data-col", roundIdx);
					input.value = con.roundScores[roundIdx];
					input.addEventListener("input", function () {
						var prevTotal = getCumulative(con);
						var val = parseFloat(this.value) || 0;
						con.roundScores[roundIdx] = val;
						var newTotal = getCumulative(con);
						var cumCell = this.parentNode.parentNode.querySelector(".table-cumulative");
						cumCell.innerText = newTotal;
						if (prevTotal != newTotal) {
							con.score = newTotal;
						}
					});
					td.appendChild(input);
					td.addEventListener("mouseup", function () {
						input.focus();
						input.select();
					});
					row.appendChild(td);
				})(con, r);
			}

			var td = document.createElement("td");
			td.className = "table-cumulative";
			td.innerText = getCumulative(con);
			row.appendChild(td);

			tbody.appendChild(row);
		}
		table.appendChild(tbody);

		table.addEventListener("keydown", function (e) {
			var key = e.key || "";

			if (key !== "Tab" && e.keyCode !== 9) return;

			var input = e.target;

			if (!input || input.className.indexOf("table-score-input") === -1) return;

			var inputRow = parseInt(input.getAttribute("data-row"), 10);
			var inputCol = parseInt(input.getAttribute("data-col"), 10);
			var rowCount = sortedByOriginal.length;

			var nextRow = inputRow;
			var nextCol = inputCol;

			if (e.shiftKey) {
				if (inputRow > 0) {
					nextRow = inputRow - 1;
				} else if (inputCol > 0) {
					nextRow = rowCount - 1;
					nextCol = inputCol - 1;
				} else {
					return;
				}
			} else {
				if (inputRow < rowCount - 1) {
					nextRow = inputRow + 1;
				} else if (inputCol < roundCount - 1) {
					nextRow = 0;
					nextCol = inputCol + 1;
				} else {
					return;
				}
			}

			e.preventDefault();

			var next = table.querySelector('.table-score-input[data-row="' + nextRow + '"][data-col="' + nextCol + '"]');

			if (next) {
				next.focus();
				next.select();
			}
		});

		tableContainer.appendChild(table);
	}

	function refreshContestants() {
		main.innerHTML = "";

		for (var i = contestants.length; i > 0; --i) {
			var con = contestants[i - 1];

			var cEl = createContestantEl(con, i);
			con.el = cEl;
		}

		if (contestants.length > 0) transformContestants();

		for (var i = contestants.length; i > 0; --i) {
			var con = contestants[i - 1];
			main.appendChild(con.el);
		}

		// if (!locked) {
		// 	main.appendChild(createAdd(contestants.length));
		// }

		rebuildScoreTable();
	}

	function ease(t, a, b) {
		var eased = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
		return (b - a) * eased + a;
	}

	function showPointsGain(con, minGain, maxGain) {
		var delta = con.score - con.oldScore;

		if (Math.abs(delta) < 0.001) return;

		delta = Math.round(delta * 100) / 100;

		var size = pointGainMaxSize;

		if (maxGain > minGain) {
			var ratio = (delta - minGain) / (maxGain - minGain);
			size = pointGainMinSize + (pointGainMaxSize - pointGainMinSize) * ratio;
		}

		var el = document.createElement("div");
		el.classList.add("point-gain");
		el.innerText = (delta > 0 ? "+" : "") + delta;
		el.style.fontSize = size + "px";

		con.el.querySelector(".score-container").appendChild(el);

		setTimeout(function () {
			if (el.parentNode) el.parentNode.removeChild(el);
		}, 8000);
	}

	function play() {
		if (!locked) {
			locked = true;

			document.body.classList.add("locked");

			resize();
		}

		setTimeout(function () {
			var start = 0;
			var loop = function (dt) {
				if (start == 0) {
					start = dt;
				}

				for (var i = 0, l = contestants.length; i < l; ++i) {
					var con = contestants[i];

					var startRemainder = con.oldScore - Math.floor(con.oldScore);
					var endRemainder = con.score - Math.floor(con.score);

					var scoreEl = con.el.querySelector(".score");

					var score = Math.round(ease(Math.min((dt - start) / 2000, 1), Math.floor(con.oldScore), Math.floor(con.score)));

					if (dt - start < 1000) {
						score += startRemainder;
					} else {
						score += endRemainder;
					}

					scoreEl.innerText = score;
				}

				if (dt - start < 2000) {
					window.requestAnimationFrame(loop);
				} else {
					for (var i = 0, l = contestants.length; i < l; ++i) {
						var con = contestants[i];
						con.oldScore = con.score;
					}
				}
			};

			var minGain = Infinity;
			var maxGain = -Infinity;

			for (var i = 0, l = contestants.length; i < l; ++i) {
				var gain = Math.round((contestants[i].score - contestants[i].oldScore) * 100) / 100;
				if (Math.abs(gain) < 0.001) continue;
				if (gain < minGain) minGain = gain;
				if (gain > maxGain) maxGain = gain;
			}

			for (var i = 0, l = contestants.length; i < l; ++i) {
				showPointsGain(contestants[i], minGain, maxGain);
			}

			window.requestAnimationFrame(loop);

			setTimeout(transformContestants, 2000);
		}, 1000);
	}

	playButton.addEventListener("mouseup", play);

	window.addEventListener('keydown', function (event) {
		if (event.code === 'Space' || event.key === ' ') {
			play();
		}
	});

	function toggleTable() {
		var isHidden = tableContainer.classList.toggle("hidden");
		tableIndicator.classList.toggle("show", isHidden);
		var toggleBtn = document.querySelector("#score-table-toolbar .toggle-btn");
		if (toggleBtn) toggleBtn.innerText = isHidden ? "Show" : "Hide";
	}

	window.addEventListener('keydown', function (event) {
		if (event.code === 'KeyT' || event.key === 't' || event.key === 'T') {
			toggleTable();
		}
	});

	tableIndicator.addEventListener("mouseup", toggleTable);


	// TASKS
	roundLabels = ["prize", "prediction", "smile", "jar", "roll", "story", "duck", "live"];
	roundCount = roundLabels.length;
	// CONTESTANTS
	addContestant("./images/Robert.png");
	addContestant("./images/John.png");
	addContestant("./images/Margaret.png");
	addContestant("./images/Ash.png");

	refreshContestants();

	function resize(rep) {
		var w = window.innerWidth;
		var h = window.innerHeight;

		var wm = 1400 * (contestants.length / 5);

		var m = Math.min(w / wm, h / 1080);

		main.style.msTransform = "scale(" + m + ")";
		main.style.transform = "scale(" + m + ")";

		main.style.left = (w - wm * m) / 2 + "px";
	}

	window.addEventListener("resize", resize);
	resize();
})();
