if (window.location.protocol === 'file:') {
      window.location.replace('http://localhost:3000/');
    }
    var API_BASE = (window.location.protocol === 'http:' || window.location.protocol === 'https:') ? window.location.origin : 'http://localhost:3000';
    var AIRLINE_LOGOS = {
      S9: '/src/assets/icons/airline-logos/airsial.svg',
      PK: 'https://images.kiwi.com/airlines/64/PK.png',
      PA: 'https://images.kiwi.com/airlines/64/PA.png',
      '9P': 'https://images.kiwi.com/airlines/64/9P.png',
      FZ: 'https://images.kiwi.com/airlines/64/FZ.png',
      OV: 'https://images.kiwi.com/airlines/64/OV.png',
      XY: 'https://images.kiwi.com/airlines/64/XY.png',
      WY: 'https://images.kiwi.com/airlines/64/WY.png',
      G9: 'https://images.kiwi.com/airlines/64/G9.png',
      F3: 'https://images.kiwi.com/airlines/64/F3.png',
      J9: 'https://images.kiwi.com/airlines/64/J9.png'
    };
    function getAirlineLogoUrl(code) {
      var url = AIRLINE_LOGOS[code];
      if (url) return url;
      if (code) return 'https://images.kiwi.com/airlines/64/' + code + '.png';
      return '/src/assets/icons/airline-logos/placeholder.svg';
    }
    var searchTimeout = null;
    var AIRPORTS_PRELOADED = null;

    (function preloadAirports() {
      var fb = { departure: [{name:'Karachi',code:'KHI'},{name:'Lahore',code:'LHE'},{name:'Islamabad',code:'ISB'}], arrival: [{name:'Dubai',code:'DXB'},{name:'Doha',code:'DOH'},{name:'London',code:'LHR'},{name:'Istanbul',code:'IST'},{name:'Abu Dhabi',code:'AUH'},{name:'Jeddah',code:'JED'},{name:'Singapore',code:'SIN'},{name:'Kuala Lumpur',code:'KUL'}] };
      fetch(API_BASE + '/api/airports?_=' + Date.now()).then(function(r) { return r.json(); }).then(function(data) {
        AIRPORTS_PRELOADED = data;
      }).catch(function() { AIRPORTS_PRELOADED = fb; });
    })();

    function showAirportResults(dropdownEl, inputEl, items) {
      dropdownEl.textContent = '';
      var isFromOrTo = inputEl && (inputEl.id === 'from-hero' || inputEl.id === 'from' || inputEl.id === 'to-hero' || inputEl.id === 'to');
      if (isFromOrTo) {
        var heading = document.createElement('div');
        heading.className = 'airport-dropdown-heading';
        heading.textContent = 'Popular Cities';
        dropdownEl.appendChild(heading);
      }
      var list = [];
      if (items && items.length !== 0) {
        list = (items.departure || []).concat(items.arrival || []);
        if (Array.isArray(items)) list = items;
        else if (items.data) list = items.data;
        if (!Array.isArray(list)) list = [];
        var seen = {};
        list = list.filter(function(a) {
          var k = (a.iataCode || a.code || '').toUpperCase();
          if (!k || seen[k]) return false;
          seen[k] = true;
          return true;
        });
      }
      list.slice(0, 20).forEach(function(a) {
        var name = a.name || '';
        var city = a.city || a.name || '';
        var code = a.iataCode || a.code || '';
        var val = city + ', ' + code;
        var item = document.createElement('div');
        item.className = 'airport-dropdown-item';
        item.setAttribute('data-value', val);
        item.appendChild(document.createTextNode(name + ' '));
        var strong = document.createElement('strong');
        strong.textContent = '(' + code + ')';
        item.appendChild(strong);
        item.addEventListener('click', function() {
          inputEl.value = item.getAttribute('data-value') || '';
          inputEl.classList.remove('invalid');
          dropdownEl.classList.remove('open');
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          // Sync hero bar to main form
          if (inputEl.id === 'from-hero') { var m = document.getElementById('from'); if (m) m.value = inputEl.value; }
          if (inputEl.id === 'to-hero') { var m = document.getElementById('to'); if (m) m.value = inputEl.value; }
          // Focus date field when arrival airport is selected
          if (inputEl.id === 'to' || inputEl.id === 'to-hero') {
            requestAnimationFrame(function() {
              requestAnimationFrame(function() {
                setTimeout(function() {
                  var card = document.querySelector('.flight-search-card');
                  if (card && !card.classList.contains('multicity')) {
                    var travelDate = document.getElementById('transparent-depart-date-home');
                    if (travelDate) travelDate.focus();
                  }
                }, 100);
              });
            });
          }
        });
        dropdownEl.appendChild(item);
      });
      dropdownEl.classList.add('open');
    }

    function getAirportList() {
      if (AIRPORTS_PRELOADED) {
        var d = AIRPORTS_PRELOADED.departure || [], a = AIRPORTS_PRELOADED.arrival || [];
        return d.concat(a);
      }
      return null;
    }

    function filterAirports(list, q) {
      if (!list || !list.length) return [];
      if (!q) return list;
      var k = q.toLowerCase();
      return list.filter(function(x) {
        return (x.name || '').toLowerCase().indexOf(k) >= 0 || (x.code || '').toLowerCase().indexOf(k) >= 0;
      });
    }

    function showFromPreloaded(dropdownEl, inputEl, q) {
      var list = getAirportList();
      if (!list) return false;
      var filtered = filterAirports(list, q);
      showAirportResults(dropdownEl, inputEl, filtered);
      return true;
    }

    function initAirportAutocomplete(inputEl, dropdownEl) {
      if (!inputEl || !dropdownEl) return;

      function doSearch(q) {
        q = (q || '').trim();
        if (showFromPreloaded(dropdownEl, inputEl, q)) return;
        if (!q) {
          fetch(API_BASE + '/api/airports?_=' + Date.now()).then(function(r) { return r.json(); }).then(function(res) {
            AIRPORTS_PRELOADED = res;
            showAirportResults(dropdownEl, inputEl, res);
          }).catch(function() {
            var fb = { departure: [{name:'Karachi',code:'KHI'},{name:'Lahore',code:'LHE'},{name:'Islamabad',code:'ISB'}], arrival: [{name:'Dubai',code:'DXB'},{name:'Doha',code:'DOH'},{name:'London',code:'LHR'},{name:'Istanbul',code:'IST'}] };
            showAirportResults(dropdownEl, inputEl, fb);
          });
          return;
        }
        if (q.length >= 2) {
          var list = getAirportList();
          if (list) {
            showAirportResults(dropdownEl, inputEl, filterAirports(list, q));
            return;
          }
          fetch(API_BASE + '/api/city-and-airport-search/' + encodeURIComponent(q) + '?_=' + Date.now())
            .then(function(r) { return r.json(); })
            .then(function(res) { showAirportResults(dropdownEl, inputEl, res); })
            .catch(function() { showFromPreloaded(dropdownEl, inputEl, q); });
        }
      }

      inputEl.addEventListener('input', function() {
        var q = (inputEl.value || '').trim();
        clearTimeout(searchTimeout);
        dropdownEl.classList.remove('open');
        dropdownEl.innerHTML = '';
        if (showFromPreloaded(dropdownEl, inputEl, q)) return;
        if (q.length < 2) return;
        searchTimeout = setTimeout(function() { doSearch(q); }, 200);
      });

      inputEl.addEventListener('focus', function() {
        var q = (inputEl.value || '').trim();
        clearTimeout(searchTimeout);
        doSearch(q);
      });

      inputEl.addEventListener('blur', function() {
        setTimeout(function() { dropdownEl.classList.remove('open'); }, 220);
      });
    }

    (function initAllAirportAutocomplete() {
      initAirportAutocomplete(document.getElementById('from'), document.getElementById('from-dropdown'));
      initAirportAutocomplete(document.getElementById('to'), document.getElementById('to-dropdown'));
      document.querySelectorAll('.airport-autocomplete').forEach(function(wrap) {
        var inp = wrap.querySelector('.airport-input');
        var dd = wrap.querySelector('.airport-dropdown');
        if (inp && dd) initAirportAutocomplete(inp, dd);
      });
    })();

    (function initAirportClearButtons() {
      var fromInp = document.getElementById('from-hero');
      var toInp = document.getElementById('to-hero');
      var fromClear = document.getElementById('from-hero-clear');
      var toClear = document.getElementById('to-hero-clear');
      var fromWrap = document.getElementById('from-hero-wrap');
      var toWrap = document.getElementById('to-hero-wrap');
      function updateClearBtn(inp, btn, wrap) {
        if (!inp || !btn || !wrap) return;
        var hasVal = (inp.value || '').trim().length > 0;
        btn.classList.toggle('visible', hasVal);
        wrap.classList.toggle('has-clear', hasVal);
      }
      function setupClear(inp, btn, wrap, mainId) {
        if (!inp || !btn) return;
        inp.addEventListener('input', function() { updateClearBtn(inp, btn, wrap); });
        inp.addEventListener('change', function() { updateClearBtn(inp, btn, wrap); });
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          inp.value = '';
          inp.classList.remove('invalid');
          var main = document.getElementById(mainId);
          if (main) main.value = '';
          updateClearBtn(inp, btn, wrap);
          var dd = wrap ? wrap.querySelector('.airport-dropdown') : null;
          if (dd) dd.classList.remove('open');
        });
        updateClearBtn(inp, btn, wrap);
      }
      setupClear(fromInp, fromClear, fromWrap, 'from');
      setupClear(toInp, toClear, toWrap, 'to');
    })();

    // Initialize home Travel Date with Flatpickr range picker.
    (function initHomeDateFields() {
      var departDateInput = document.getElementById('transparent-depart-date-home');
      var returnDateInput = document.getElementById('transparent-return-date-home-input');
      var departureHidden = document.getElementById('departure');
      var returnDateHidden = document.getElementById('return-date');
      if (!departDateInput || !returnDateInput || !departureHidden || !returnDateHidden || typeof flatpickr === 'undefined') return;

      function isOneWay() {
        var r = document.querySelector('input[name="trip-home"]:checked');
        return r && r.value === 'oneway';
      }

      function toYmd(d) {
        return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
      }
      function getShowMonths() {
        if (window.innerWidth <= 640) return 1;
        if (window.innerWidth <= 1024) return 2;
        return 3;
      }
      function applyFullWidthCalendarStyle(inst) {
        var cal = inst && inst.calendarContainer;
        if (!cal) return;
        var area = departDateInput.closest('.transparent-search-content') ||
          departDateInput.closest('.transparent-home-search') ||
          departDateInput.closest('.transparent-flight-search') ||
          departDateInput.closest('.home-flight-search-wrap');
        var inputRect = departDateInput.getBoundingClientRect();
        var areaRect = area ? area.getBoundingClientRect() : null;
        var width = areaRect ? areaRect.width : Math.min(window.innerWidth - 16, 980);
        var left = areaRect ? areaRect.left : Math.max(8, Math.min(inputRect.left, window.innerWidth - width - 8));
        var finalWidth = Math.min(width, window.innerWidth - 16);
        var finalLeft = Math.max(8, left);
        var computed = window.getComputedStyle(cal);
        var hPad = (parseFloat(computed.paddingLeft) || 0) + (parseFloat(computed.paddingRight) || 0);
        var hBorder = (parseFloat(computed.borderLeftWidth) || 0) + (parseFloat(computed.borderRightWidth) || 0);
        var innerWidth = Math.max(320, Math.floor(finalWidth - hPad - hBorder));
        var months = Math.max(1, (inst && inst.config && inst.config.showMonths) || 1);
        var monthWidth = Math.floor(innerWidth / months);

        cal.style.setProperty('position', 'fixed', 'important');
        cal.style.setProperty('transform', 'none', 'important');
        cal.style.setProperty('margin', '0', 'important');
        cal.style.setProperty('width', finalWidth + 'px', 'important');
        cal.style.setProperty('min-width', finalWidth + 'px', 'important');
        cal.style.setProperty('max-width', finalWidth + 'px', 'important');
        cal.style.setProperty('top', (inputRect.bottom + 8) + 'px', 'important');
        cal.style.setProperty('left', finalLeft + 'px', 'important');
        cal.style.setProperty('right', 'auto', 'important');

        // Keep lower calendar grid expanded to same full width as header.
        var monthsWrap = cal.querySelector('.flatpickr-months');
        var rContainer = cal.querySelector('.flatpickr-rContainer');
        var daysWrap = cal.querySelector('.flatpickr-days');
        if (monthsWrap) {
          monthsWrap.style.setProperty('width', innerWidth + 'px', 'important');
        }
        if (rContainer) {
          rContainer.style.setProperty('width', innerWidth + 'px', 'important');
          rContainer.style.setProperty('min-width', innerWidth + 'px', 'important');
          rContainer.style.setProperty('max-width', innerWidth + 'px', 'important');
        }
        if (daysWrap) {
          daysWrap.style.setProperty('width', innerWidth + 'px', 'important');
          daysWrap.style.setProperty('min-width', innerWidth + 'px', 'important');
          daysWrap.style.setProperty('max-width', innerWidth + 'px', 'important');
          daysWrap.style.setProperty('display', 'flex', 'important');
          daysWrap.style.setProperty('gap', '0', 'important');
        }
        cal.querySelectorAll('.flatpickr-month').forEach(function(monthEl) {
          monthEl.style.setProperty('width', monthWidth + 'px', 'important');
          monthEl.style.setProperty('max-width', monthWidth + 'px', 'important');
          monthEl.style.setProperty('flex', '0 0 ' + monthWidth + 'px', 'important');
        });
        cal.querySelectorAll('.dayContainer').forEach(function(dc) {
          dc.style.setProperty('width', monthWidth + 'px', 'important');
          dc.style.setProperty('min-width', monthWidth + 'px', 'important');
          dc.style.setProperty('max-width', monthWidth + 'px', 'important');
          dc.style.setProperty('flex', '0 0 ' + monthWidth + 'px', 'important');
        });
      }
      function forceCalendarFullWidth(inst) {
        if (!inst) return;
        applyFullWidthCalendarStyle(inst);
        requestAnimationFrame(function() { applyFullWidthCalendarStyle(inst); });
        setTimeout(function() { applyFullWidthCalendarStyle(inst); }, 30);
      }

      var fp = flatpickr(departDateInput, {
        mode: 'range',
        minDate: 'today',
        dateFormat: 'd M Y',
        showMonths: getShowMonths(),
        static: false,
        appendTo: document.body,
        position: 'auto center',
        disableMobile: true,
        allowInput: false,
        onReady: function(_, __, inst) {
          inst.set('showMonths', getShowMonths());
          inst.set('mode', isOneWay() ? 'single' : 'range');
          forceCalendarFullWidth(inst);
        },
        onOpen: function(_, __, inst) {
          inst.set('showMonths', getShowMonths());
          forceCalendarFullWidth(inst);
        },
        onMonthChange: function(_, __, inst) {
          forceCalendarFullWidth(inst);
        },
        onYearChange: function(_, __, inst) {
          forceCalendarFullWidth(inst);
        },
        onChange: function(selectedDates, _, inst) {
          if (!selectedDates || selectedDates.length === 0) {
            departureHidden.value = '';
            returnDateHidden.value = '';
            returnDateInput.value = '';
            return;
          }

          departureHidden.value = toYmd(selectedDates[0]);
          if (selectedDates[1]) {
            returnDateHidden.value = toYmd(selectedDates[1]);
            returnDateInput.value = returnDateHidden.value;
          } else {
            returnDateHidden.value = '';
            returnDateInput.value = '';
          }

          if (isOneWay() && selectedDates[0]) {
            inst.close();
          }
        }
      });

      if (departureHidden.value) {
        var initDates = [departureHidden.value];
        if (returnDateHidden.value) initDates.push(returnDateHidden.value);
        fp.setDate(initDates, true);
      }

      document.querySelectorAll('input[name="trip-home"]').forEach(function(r) {
        r.addEventListener('change', function() {
          fp.set('mode', isOneWay() ? 'single' : 'range');
          if (isOneWay()) {
            returnDateHidden.value = '';
            returnDateInput.value = '';
            if (fp.selectedDates && fp.selectedDates[0]) {
              fp.setDate(fp.selectedDates[0], true);
            }
          }
        });
      });
      window.addEventListener('resize', function() {
        if (fp) {
          fp.set('showMonths', getShowMonths());
          if (fp.isOpen) forceCalendarFullWidth(fp);
        }
      });

      window.openHomeDepartCalendarFn = undefined;
    })();

    // Initialize passengers dropdown for home form
    (function initHomePassengersDropdown() {
      const passengersInput = document.getElementById('transparent-passengers-home');
      const passengersDropdown = document.getElementById('transparent-passengers-dropdown-home');
      
      if (!passengersInput || !passengersDropdown) return;
      
      // Passenger counts for home form
      var transparentPaxCountsHome = {
        adults: 1,
        children: 0,
        infants: 0
      };
      
      // Ensure default value is set
      if (transparentPaxCountsHome.adults === 0) {
        transparentPaxCountsHome.adults = 1;
      }
      
      // Function to update passengers label (line 1: "Guest and Cabin", line 2: "1 Guest, Economy")
      function updateHomePassengersLabel() {
        if (!passengersInput) return;
        var total = transparentPaxCountsHome.adults + transparentPaxCountsHome.children + transparentPaxCountsHome.infants;
        if (total < 1) {
          transparentPaxCountsHome.adults = 1;
          total = 1;
        }
        var cabinInput = document.getElementById('transparent-class-home-2');
        var cabinText = (cabinInput && cabinInput.value) ? cabinInput.value : 'Economy';
        var valueText = total + (total === 1 ? ' Passenger' : ' Passengers') + ', ' + cabinText;
        passengersInput.value = valueText;
        var label = passengersInput.previousElementSibling;
        if (label && label.tagName === 'LABEL') {
          var labelSpan = label.querySelector('.label');
          if (labelSpan) labelSpan.textContent = 'Passengers & Cabin';
          label.style.opacity = '1';
          label.style.visibility = 'visible';
          label.style.display = 'flex';
        }
      }
      
      // Function to update passengers display
      function updateHomePassengersDisplay() {
        var adultVal = document.getElementById('pax-adult-val-home');
        var childVal = document.getElementById('pax-child-val-home');
        var infantVal = document.getElementById('pax-infant-val-home');
        var adultMinus = document.getElementById('pax-adult-minus-home');
        var childMinus = document.getElementById('pax-child-minus-home');
        var infantMinus = document.getElementById('pax-infant-minus-home');
        
        if (adultVal) adultVal.textContent = transparentPaxCountsHome.adults;
        if (childVal) childVal.textContent = transparentPaxCountsHome.children;
        if (infantVal) infantVal.textContent = transparentPaxCountsHome.infants;
        
        if (adultMinus) adultMinus.disabled = transparentPaxCountsHome.adults <= 1;
        if (childMinus) childMinus.disabled = transparentPaxCountsHome.children <= 0;
        if (infantMinus) infantMinus.disabled = transparentPaxCountsHome.infants <= 0;
        
        updateHomePassengersLabel();
        
        // Update hidden fields
        var adultsHidden = document.getElementById('passengers-adults');
        var childrenHidden = document.getElementById('passengers-children');
        var infantsHidden = document.getElementById('passengers-infants');
        if (adultsHidden) adultsHidden.value = transparentPaxCountsHome.adults;
        if (childrenHidden) childrenHidden.value = transparentPaxCountsHome.children;
        if (infantsHidden) infantsHidden.value = transparentPaxCountsHome.infants;
      }
      
      function positionHomePassengersDropdown() {
        if (!passengersDropdown || !passengersInput) return;
        if (!passengersDropdown.classList.contains('open')) return;
        var rect = passengersInput.getBoundingClientRect();
        var searchArea = passengersInput.closest('.transparent-search-content') ||
          passengersInput.closest('.transparent-home-search') ||
          passengersInput.closest('.transparent-flight-search') ||
          passengersInput.closest('.home-flight-search-wrap');
        if (searchArea) {
          var sa = searchArea.getBoundingClientRect();
          passengersDropdown.style.left = sa.left + 'px';
          passengersDropdown.style.width = sa.width + 'px';
          passengersDropdown.style.minWidth = sa.width + 'px';
          passengersDropdown.style.right = 'auto';
        } else {
          passengersDropdown.style.left = rect.left + 'px';
          passengersDropdown.style.width = '';
          passengersDropdown.style.minWidth = '';
          passengersDropdown.style.right = 'auto';
        }
        passengersDropdown.style.top = (rect.bottom + 8) + 'px';
      }
      // Function to open passengers dropdown
      function openHomePassengersDropdown() {
        if (!passengersDropdown || !passengersInput) return;
        updateHomePassengersDisplay();
        var cabinEconomy = document.querySelector('input[name="cabin-home"][value="Economy"]');
        if (cabinEconomy) cabinEconomy.checked = true;
        
        // Close class dropdown if open (legacy)
        var otherDropdown = document.getElementById('transparent-class-dropdown-home-2');
        if (otherDropdown && otherDropdown.classList.contains('open')) {
          otherDropdown.classList.remove('open');
        }
        
        passengersDropdown.classList.add('open');
        if (passengersDropdown.parentNode !== document.body) {
          document.body.appendChild(passengersDropdown);
        }
        positionHomePassengersDropdown();
      }
      
      // Function to close passengers dropdown
      function closeHomePassengersDropdown() {
        if (passengersDropdown) {
          passengersDropdown.classList.remove('open');
        }
      }
      
      // Add click event listener (whole field for Etihad layout)
      var guestsField = passengersInput ? passengersInput.closest('.etihad-field-guests') : null;
      var clickTarget = guestsField || passengersInput;
      if (clickTarget) {
        clickTarget.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          if (passengersDropdown.classList.contains('open')) {
            closeHomePassengersDropdown();
          } else {
            openHomePassengersDropdown();
          }
        });
      }
      
      // Add event listeners for +/- buttons
      var adultPlus = document.getElementById('pax-adult-plus-home');
      var adultMinus = document.getElementById('pax-adult-minus-home');
      var childPlus = document.getElementById('pax-child-plus-home');
      var childMinus = document.getElementById('pax-child-minus-home');
      
      if (adultPlus) {
        adultPlus.addEventListener('click', function(e) {
          e.stopPropagation();
          transparentPaxCountsHome.adults++;
          updateHomePassengersDisplay();
        });
      }
      if (adultMinus) {
        adultMinus.addEventListener('click', function(e) {
          e.stopPropagation();
          if (transparentPaxCountsHome.adults > 1) {
            transparentPaxCountsHome.adults--;
            updateHomePassengersDisplay();
          }
        });
      }
      if (childPlus) {
        childPlus.addEventListener('click', function(e) {
          e.stopPropagation();
          transparentPaxCountsHome.children++;
          updateHomePassengersDisplay();
        });
      }
      if (childMinus) {
        childMinus.addEventListener('click', function(e) {
          e.stopPropagation();
          if (transparentPaxCountsHome.children > 0) {
            transparentPaxCountsHome.children--;
            updateHomePassengersDisplay();
          }
        });
      }
      var infantPlus = document.getElementById('pax-infant-plus-home');
      var infantMinus = document.getElementById('pax-infant-minus-home');
      if (infantPlus) {
        infantPlus.addEventListener('click', function(e) {
          e.stopPropagation();
          transparentPaxCountsHome.infants++;
          updateHomePassengersDisplay();
        });
      }
      if (infantMinus) {
        infantMinus.addEventListener('click', function(e) {
          e.stopPropagation();
          if (transparentPaxCountsHome.infants > 0) {
            transparentPaxCountsHome.infants--;
            updateHomePassengersDisplay();
          }
        });
      }
      // Cabin radio sync
      var cabinRadios = document.querySelectorAll('input[name="cabin-home"]');
      cabinRadios.forEach(function(radio) {
        radio.addEventListener('change', function() {
          var class2Field = document.getElementById('transparent-class-home-2');
          var classSelect = document.getElementById('class');
          var cabinToClass = { Economy: 'Economy Class', 'Premium Economy': 'Premium Economy', Business: 'Business Class', First: 'First Class' };
          var classValue = cabinToClass[this.value] || 'Economy Class';
          if (class2Field) class2Field.value = this.value;
          if (classSelect) classSelect.value = classValue;
          updateHomePassengersLabel();
        });
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', function(e) {
        if (passengersDropdown && passengersDropdown.classList.contains('open')) {
          var triggerEl = guestsField || passengersInput;
          if (!passengersDropdown.contains(e.target) && !(triggerEl && triggerEl.contains(e.target))) {
            closeHomePassengersDropdown();
          }
        }
      });
      var passengersScrollRaf = null;
      function onPassengersScrollResize() {
        if (!passengersDropdown || !passengersDropdown.classList.contains('open')) return;
        if (passengersScrollRaf) return;
        passengersScrollRaf = requestAnimationFrame(function() {
          passengersScrollRaf = null;
          positionHomePassengersDropdown();
        });
      }
      window.addEventListener('scroll', onPassengersScrollResize, { passive: true, capture: true });
      window.addEventListener('resize', onPassengersScrollResize);
      
      // Initialize display
      var adultVal = document.getElementById('pax-adult-val-home');
      var childVal = document.getElementById('pax-child-val-home');
      var infantVal = document.getElementById('pax-infant-val-home');
      var adultMinus = document.getElementById('pax-adult-minus-home');
      var childMinus = document.getElementById('pax-child-minus-home');
      var infantMinus = document.getElementById('pax-infant-minus-home');
      
      if (adultVal) adultVal.textContent = transparentPaxCountsHome.adults;
      if (childVal) childVal.textContent = transparentPaxCountsHome.children;
      if (infantVal) infantVal.textContent = transparentPaxCountsHome.infants;
      
      if (adultMinus) adultMinus.disabled = transparentPaxCountsHome.adults <= 1;
      if (childMinus) childMinus.disabled = transparentPaxCountsHome.children <= 0;
      if (infantMinus) infantMinus.disabled = transparentPaxCountsHome.infants <= 0;
      
      // Update hidden fields
      var adultsHidden = document.getElementById('passengers-adults');
      var childrenHidden = document.getElementById('passengers-children');
      var infantsHidden = document.getElementById('passengers-infants');
      if (adultsHidden) adultsHidden.value = transparentPaxCountsHome.adults;
      if (childrenHidden) childrenHidden.value = transparentPaxCountsHome.children;
      if (infantsHidden) infantsHidden.value = transparentPaxCountsHome.infants;
      
      updateHomePassengersLabel();
    })();

    // Initialize class dropdown 2 for home form
    (function initHomeClassDropdown2() {
      const classInput2 = document.getElementById('transparent-class-home-2');
      const classDropdown2 = document.getElementById('transparent-class-dropdown-home-2');
      
      if (!classInput2 || !classDropdown2) return;
      
      var selectedClass2 = 'Economy'; // Default value
      
      // Function to update class label
      function updateHomeClassLabel2() {
        if (!classInput2) return;
        var label = classInput2.nextElementSibling;
        if (label && label.tagName === 'LABEL') {
          var labelSpan = label.querySelector('.label');
          if (labelSpan) {
            labelSpan.textContent = selectedClass2 || 'Economy';
            // Ensure label is visible
            label.style.opacity = '1';
            label.style.visibility = 'visible';
            label.style.display = 'flex';
          }
        }
      }
      
      // Function to open class dropdown
      function openHomeClassDropdown2() {
        if (!classDropdown2 || !classInput2) return;
        
        // Close other dropdowns if open
        var otherDropdown = document.getElementById('transparent-passengers-dropdown-home');
        if (otherDropdown && otherDropdown.classList.contains('open')) {
          otherDropdown.classList.remove('open');
        }
        
        var rect = classInput2.getBoundingClientRect();
        classDropdown2.style.left = rect.left + 'px';
        classDropdown2.style.top = (rect.bottom + 8) + 'px';
        classDropdown2.classList.add('open');
        
        // Ensure dropdown is appended to body for correct positioning
        if (classDropdown2.parentNode !== document.body) {
          document.body.appendChild(classDropdown2);
        }
      }
      
      // Function to close class dropdown
      function closeHomeClassDropdown2() {
        if (classDropdown2) {
          classDropdown2.classList.remove('open');
        }
      }
      
      // Add click event listener to input
      if (classInput2) {
        classInput2.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          if (classDropdown2.classList.contains('open')) {
            closeHomeClassDropdown2();
          } else {
            openHomeClassDropdown2();
          }
        });
      }
      
      // Add event listeners for class rows (entire row is clickable)
      var classRows = classDropdown2.querySelectorAll('.transparent-passengers-row');
      classRows.forEach(function(row) {
        row.style.cursor = 'pointer';
        row.addEventListener('click', function(e) {
          e.stopPropagation();
          selectedClass2 = row.getAttribute('data-value');
          updateHomeClassLabel2();
          closeHomeClassDropdown2();
          
          // Sync with hidden class field if it exists
          var hiddenClassField = document.getElementById('class');
          if (hiddenClassField) {
            hiddenClassField.value = selectedClass2;
          }
          var class2Field = document.getElementById('transparent-class-home-2');
          if (class2Field) {
            class2Field.value = selectedClass2;
          }
          if (typeof updateHomePassengersLabel === 'function') {
            updateHomePassengersLabel();
          }
        });
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', function(e) {
        if (classDropdown2 && classDropdown2.classList.contains('open')) {
          if (!classDropdown2.contains(e.target) && !classInput2.contains(e.target)) {
            closeHomeClassDropdown2();
          }
        }
      });
      
      // Initialize label
      updateHomeClassLabel2();
      
      // Sync with hidden class field if it exists
      var hiddenClassField = document.getElementById('class');
      if (hiddenClassField) {
        hiddenClassField.value = selectedClass2;
      }
    })();


    function extractCode(val) {
      if (!val) return '';
      var m = val.match(/\(([A-Z]{3})\)/);
      if (m) return m[1];
      var m2 = val.match(/,\s*([A-Z]{3})\s*$/);
      return m2 ? m2[1] : val;
    }

    function escapeHtml(s) {
      if (s == null || s === undefined) return '';
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    var DAYS_SHORT_GRID = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var MONTHS_SHORT_GRID = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    function renderDatesGrid(originCode, destCode, depDate, data) {
      var gridEl = document.getElementById('flight-results-dates-grid');
      if (!gridEl) return;
      var flights = data.data || [];
      if (!flights.length || !depDate || !/^\d{4}-\d{2}-\d{2}$/.test(depDate)) {
        gridEl.innerHTML = '';
        return;
      }
      var currency = (flights[0].price && flights[0].price.currency) ? flights[0].price.currency : 'PKR';
      var basePrice = Infinity;
      flights.forEach(function(f) {
        var p = f.price && f.price.total ? parseFloat(f.price.total, 10) : 0;
        if (p > 0 && p < basePrice) basePrice = p;
      });
      if (basePrice === Infinity || basePrice <= 0) basePrice = 80000;
      var parts = depDate.split('-').map(Number);
      var selDate = new Date(parts[0], parts[1] - 1, parts[2]);
      if (isNaN(selDate.getTime())) { gridEl.innerHTML = ''; return; }
      var toYMD = function(d) {
        var y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
        return y + '-' + ('0' + (m + 1)).slice(-2) + '-' + ('0' + day).slice(-2);
      };
      var fmtCardDate = function(d) {
        return DAYS_SHORT_GRID[d.getDay()] + ', ' + ('0' + d.getDate()).slice(-2) + ' ' + MONTHS_SHORT_GRID[d.getMonth()];
      };
      var items = [];
      for (var i = -3; i <= 3; i++) {
        var d = new Date(selDate);
        d.setDate(d.getDate() + i);
        var seed = Math.abs(d.getTime() % 1000);
        var mult = 0.88 + (seed / 1000) * 0.5;
        var price = Math.round(basePrice * mult / 500) * 500;
        if (price < 5000) price = Math.round(basePrice * 0.9);
        items.push({
          date: d,
          ymd: toYMD(d),
          label: fmtCardDate(d),
          price: price,
          isSelected: i === 0
        });
      }
      var minPrice = Math.min.apply(null, items.map(function(x) { return x.price; }));
      var html = '';
      items.forEach(function(it) {
        var priceCls = it.price === minPrice ? ' lowest' : '';
        var cardCls = it.isSelected ? ' selected' : '';
        html += '<div class="flight-result-date-card' + cardCls + '" data-date="' + escapeHtml(it.ymd) + '" data-origin="' + escapeHtml(originCode) + '" data-dest="' + escapeHtml(destCode) + '">' +
          '<div class="flight-result-date-card-date">' + escapeHtml(it.label) + '</div>' +
          '<div class="flight-result-date-card-price' + priceCls + '">' + currency + ' ' + it.price.toLocaleString() + '</div></div>';
      });
      gridEl.innerHTML = html;
    }

    function renderFlights(data, listEl, destName, skipClientSort) {
      var flights = data.data || [];
      var isDemo = data.meta && data.meta.demo === true;
      var demoBanner = isDemo ? '<p class="flight-results-demo-banner">Showing sample flights. Use today\'s date for real-time data from AviationStack.</p>' : '';
      
      // Apply current filter (skip when inline filters handle sort)
      if (!skipClientSort && typeof window.getCurrentFilter === 'function') {
        var filter = window.getCurrentFilter();
        if (filter === 'cheapest') {
          flights = flights.slice().sort(function(a, b) {
            return parseFloat(a.price.total) - parseFloat(b.price.total);
          });
        } else if (filter === 'quickest') {
          flights = flights.slice().sort(function(a, b) {
            var durationA = a.itineraries[0].duration || 'PT999H';
            var durationB = b.itineraries[0].duration || 'PT999H';
            return durationA.localeCompare(durationB);
          });
        } else {
          // 'best' - balanced score
          flights = flights.slice().sort(function(a, b) {
            var parseDur = function(d) {
              if (!d) return 999;
              var m = d.match(/PT(\d+)H(\d+)?M?/);
              if (!m) return 999;
              return parseInt(m[1] || 0) * 60 + parseInt(m[2] || 0);
            };
            var scoreA = parseFloat(a.price.total) + (parseDur(a.itineraries[0].duration) / 60);
            var scoreB = parseFloat(b.price.total) + (parseDur(b.itineraries[0].duration) / 60);
            return scoreA - scoreB;
          });
        }
      }
      var dict = data.dictionaries || {};
      var carriers = dict.carriers || {};
      var aircraft = dict.aircraft || {};
      var html = '';
      flights.forEach(function(f) {
        var seg = (f.itineraries && f.itineraries[0] && f.itineraries[0].segments && f.itineraries[0].segments[0]) || {};
        var dep = seg.departure || {};
        var arr = seg.arrival || {};
        var depTime = (dep.at || '').slice(11, 16) || '--:--';
        var arrTime = (arr.at || '').slice(11, 16) || '--:--';
        var code = (f.validatingAirlineCodes && f.validatingAirlineCodes[0]) || seg.carrierCode || '';
        var name = carriers[code] || code;
        var logoUrl = getAirlineLogoUrl(code);
        var totalNum = f.price && f.price.total ? parseInt(f.price.total, 10) : 0;
        var price = totalNum ? (f.price.currency + ' ' + totalNum.toLocaleString()) : 'N/A';
        var dur = (f.itineraries && f.itineraries[0] && f.itineraries[0].duration) ? f.itineraries[0].duration.replace('PT', '').replace('H', 'h ').replace('M', 'm') : '';
        var flightNum = (seg.carrierCode || '') + (seg.number || '');
        var aircraftName = seg.aircraft && seg.aircraft.code ? (aircraft[seg.aircraft.code] || seg.aircraft.code) : '';
        var segCount = (f.itineraries && f.itineraries[0] && f.itineraries[0].segments) ? f.itineraries[0].segments.length : 1;
        var stopText = segCount <= 1 ? 'Nonstop' : (segCount - 1) + ' stop' + (segCount > 2 ? 's' : '');
        var depDateStr = '';
        if (dep.at && dep.at.length >= 10) {
          var y = parseInt(dep.at.slice(0, 4), 10), m = parseInt(dep.at.slice(5, 7), 10) - 1, d = parseInt(dep.at.slice(8, 10), 10);
          var dt = new Date(y, m, d);
          if (!isNaN(dt.getTime())) {
            depDateStr = DAYS_SHORT_GRID[dt.getDay()] + ', ' + MONTHS_SHORT_GRID[dt.getMonth()] + ' ' + ('0' + dt.getDate()).slice(-2) + ', ' + dt.getFullYear();
          }
        }

        html += '<div class="flight-result-card">' +
          '<div class="flight-result-airline-wrap"><img src="' + logoUrl + '" alt="' + (name || 'Airline') + ' logo" class="flight-result-airline-logo" onerror="this.onerror=null;this.src=\'/src/assets/icons/airline-logos/placeholder.svg\'" /><span class="flight-result-airline">' + name + '</span>' + (flightNum ? '<span class="flight-result-number">' + flightNum + '</span>' : '') + '</div>' +
          '<div class="flight-result-depart"><span class="flight-result-time">' + depTime + '</span><span class="flight-result-code">' + (dep.iataCode || '') + '</span></div>' +
          '<div class="flight-result-duration-wrap"><span class="flight-result-duration">' + dur + (aircraftName ? ' · ' + aircraftName : '') + '</span><span class="flight-result-stops">' + stopText + '</span>' + (depDateStr ? '<span class="flight-result-date">' + depDateStr + '</span>' : '') + '</div>' +
          '<div class="flight-result-arrive"><span class="flight-result-time">' + arrTime + '</span><span class="flight-result-code">' + (arr.iataCode || '') + '</span></div>' +
          '<div class="flight-result-price-wrap"><span class="flight-result-price">' + price + '</span><span class="flight-result-class">Economy</span><button type="button" class="btn-book-now">Select</button></div></div>';
      });
      listEl.innerHTML = html || '<p class="flight-results-empty">No flights found. Try different dates or airports.</p>';
    }

    function clearValidationState() {
      document.querySelectorAll('.airport-input.invalid, .ek-date-trigger.invalid, .hero-date-trigger.invalid, .transparent-input.invalid, .transparent-search-field.invalid, .transparent-search-field.has-error, .etihad-field.invalid, .etihad-field.has-error').forEach(function(el) { el.classList.remove('invalid', 'has-error'); });
      document.querySelectorAll('.validation-error-msg').forEach(function(el) { el.textContent = ''; });
      var overlay = document.getElementById('validation-alert-overlay');
      var msgEl = document.getElementById('validation-alert-msg');
      if (overlay) overlay.classList.remove('visible');
      if (msgEl) msgEl.textContent = '';
    }

    function showValidationError(message, fieldIds) {
      clearValidationState();
      var overlay = document.getElementById('validation-alert-overlay');
      var msgEl = document.getElementById('validation-alert-msg');
      if (overlay && msgEl) {
        msgEl.textContent = message;
        overlay.classList.add('visible');
      }
      (fieldIds || []).forEach(function(id) {
        var el = document.getElementById(id) || document.querySelector('[data-target="' + id + '"]');
        if (el) {
          el.classList.add('invalid');
          var field = el.closest('.transparent-search-field');
          if (field) {
            field.classList.add('invalid', 'has-error');
            var errMsg = field.querySelector('.validation-error-msg');
            if (errMsg) errMsg.textContent = message;
          }
          var etihadField = el.closest('.etihad-field');
          if (etihadField) etihadField.classList.add('invalid', 'has-error');
        } else {
          document.querySelectorAll('.' + id).forEach(function(e) { e.classList.add('invalid'); });
        }
      });
    }

    (function initValidationAlert() {
      var overlay = document.getElementById('validation-alert-overlay');
      var okBtn = document.getElementById('validation-alert-ok');
      function hideAlert() {
        if (overlay) overlay.classList.remove('visible');
      }
      if (okBtn) okBtn.addEventListener('click', hideAlert);
      if (overlay) overlay.addEventListener('click', function(e) {
        if (e.target === overlay) hideAlert();
      });
    })();

    function validateFlightSearch() {
      var tripType = document.querySelector('input[name="trip"]:checked');
      var isMulti = tripType && tripType.value === 'multicity';
      var card = document.querySelector('.flight-search-card');

      if (isMulti) {
        var segments = document.querySelectorAll('.flight-search-segment');
        var lastDate = '';
        for (var i = 0; i < segments.length; i++) {
          var seg = segments[i];
          var fromInp = seg.querySelector('.mc-from');
          var toInp = seg.querySelector('.mc-to');
          var dateInp = document.getElementById('mc-date-' + i);
          var fromVal = fromInp ? fromInp.value : '';
          var toVal = toInp ? toInp.value : '';
          var dateVal = dateInp ? dateInp.value : '';
          var fromCode = extractCode(fromVal);
          var toCode = extractCode(toVal);
          if (!fromCode) {
            showValidationError('Please select departure airport for Flight ' + (i + 1) + '.');
            if (fromInp) fromInp.classList.add('invalid');
            if (i === 0) { var h = document.getElementById('from-hero'); if (h) h.classList.add('invalid'); }
            return false;
          }
          if (!toCode) {
            showValidationError('Please select arrival airport for Flight ' + (i + 1) + '.');
            if (toInp) toInp.classList.add('invalid');
            if (i === 0) { var h = document.getElementById('to-hero'); if (h) h.classList.add('invalid'); }
            return false;
          }
          if (fromCode === toCode) {
            showValidationError('Departure and arrival cannot be the same for Flight ' + (i + 1) + '.');
            if (fromInp) fromInp.classList.add('invalid');
            if (toInp) toInp.classList.add('invalid');
            if (i === 0) {
              var fh = document.getElementById('from-hero'); var th = document.getElementById('to-hero');
              if (fh) fh.classList.add('invalid'); if (th) th.classList.add('invalid');
            }
            return false;
          }
          if (!dateVal) {
            showValidationError('Please select a date for Flight ' + (i + 1) + '.');
            var mcTrig = seg.querySelector('.mc-date');
            if (mcTrig) mcTrig.classList.add('invalid');
            if (i === 0) { var ht = document.getElementById('hero-date-trigger'); if (ht) ht.classList.add('invalid'); }
            return false;
          }
          if (lastDate && dateVal < lastDate) {
            showValidationError('Flight ' + (i + 1) + ' date must be on or after the previous flight date.');
            var mcTrig = seg.querySelector('.mc-date');
            if (mcTrig) mcTrig.classList.add('invalid');
            if (i === 0) { var ht = document.getElementById('hero-date-trigger'); if (ht) ht.classList.add('invalid'); }
            return false;
          }
          lastDate = dateVal;
        }
        clearValidationState();
        return true;
      }

      var fromVal = document.getElementById('from').value;
      var toVal = document.getElementById('to').value;
      var depDate = document.getElementById('departure').value;
      var retDate = document.getElementById('return-date').value;
      var originCode = extractCode(fromVal);
      var destCode = extractCode(toVal);
      var oneWay = tripType && tripType.value === 'oneway';

      if (!originCode) {
        showValidationError('Please select a departure airport.', ['from-hero', 'transparent-txtOriginFull-home', 'transparent-txtOriginFull-popup']);
        return false;
      }
      if (!destCode) {
        showValidationError('Please select an arrival airport.', ['to-hero', 'transparent-txtDestinationFull-home', 'transparent-txtDestinationFull-popup']);
        return false;
      }
      if (originCode === destCode) {
        showValidationError('Departure and arrival airports cannot be the same.', ['from-hero', 'to-hero', 'transparent-txtOriginFull-home', 'transparent-txtDestinationFull-home', 'transparent-txtOriginFull-popup', 'transparent-txtDestinationFull-popup']);
        return false;
      }
      if (!depDate) {
        showValidationError('Please select a departure date.', ['hero-date-trigger', 'transparent-depart-date-home', 'transparent-depart-date-popup']);
        return false;
      }
      if (!oneWay && !retDate) {
        showValidationError('Please select a return date for round-trip.', ['transparent-depart-date-home', 'transparent-return-date-home-input', 'transparent-depart-date-popup', 'transparent-return-date-popup-input']);
        return false;
      }
      if (!oneWay && retDate && depDate && retDate < depDate) {
        showValidationError('Return date must be on or after departure date.', ['transparent-depart-date-home', 'transparent-return-date-home-input', 'transparent-depart-date-popup', 'transparent-return-date-popup-input']);
        return false;
      }
      var adults = parseInt(document.getElementById('passengers-adults').value, 10) || 0;
      var infants = parseInt(document.getElementById('passengers-infants').value, 10) || 0;
      var prefix = isMulti ? 'mc-passengers' : 'passengers';
      adults = isMulti ? (parseInt(document.getElementById('mc-passengers-adults').value, 10) || 0) : adults;
      infants = isMulti ? (parseInt(document.getElementById('mc-passengers-infants').value, 10) || 0) : infants;
      if (adults < 1) {
        showValidationError('At least 1 adult passenger is required.', ['transparent-passengers-home', 'transparent-passengers-popup']);
        return false;
      }
      if (infants > adults) {
        showValidationError('Infants cannot exceed the number of adults (1 infant per adult).', ['transparent-passengers-home', 'transparent-passengers-popup']);
        return false;
      }
      clearValidationState();
      return true;
    }

    (function initValidationClearListeners() {
      function clearFieldInvalid(e) {
        var t = e.target;
        var isSearchField = t.classList && (t.classList.contains('airport-input') || t.classList.contains('ek-date-trigger') || t.classList.contains('hero-date-trigger') || t.classList.contains('transparent-input')) || t.id === 'departure' || t.id === 'return-date';
        if (isSearchField) {
          t.classList.remove('invalid');
          var field = t.closest('.transparent-search-field');
          if (field) {
            field.classList.remove('invalid', 'has-error');
            var errMsg = field.querySelector('.validation-error-msg');
            if (errMsg) errMsg.textContent = '';
          }
          var etihadField = t.closest('.etihad-field');
          if (etihadField) etihadField.classList.remove('invalid', 'has-error');
          if (t.id === 'departure' || t.id === 'return-date') {
            var depDisplay = document.getElementById('transparent-depart-date-home');
            if (depDisplay) {
              depDisplay.classList.remove('invalid');
              var f = depDisplay.closest('.transparent-search-field');
              if (f) f.classList.remove('invalid', 'has-error');
              var ef = depDisplay.closest('.etihad-field');
              if (ef) ef.classList.remove('invalid', 'has-error');
            }
          }
        }
        var isPassengers = t.id === 'transparent-passengers-home' || (t.closest && t.closest('.etihad-field-guests')) || t.id === 'passengers-adults' || t.id === 'passengers-children' || t.id === 'passengers-infants';
        if (isPassengers) {
          var guestsField = document.querySelector('.etihad-field-guests');
          if (guestsField) guestsField.classList.remove('invalid', 'has-error');
          var guestsInput = document.getElementById('transparent-passengers-home');
          if (guestsInput) guestsInput.classList.remove('invalid');
          var overlay = document.getElementById('validation-alert-overlay');
          if (overlay) overlay.classList.remove('visible');
        }
      }
      var form = document.getElementById('flight-search-form');
      if (form) {
        form.addEventListener('input', clearFieldInvalid);
        form.addEventListener('change', clearFieldInvalid);
        form.addEventListener('focus', clearFieldInvalid, true);
        form.addEventListener('click', clearFieldInvalid, true);
      }
      var heroBar = document.querySelector('.hero-search-bar');
      if (heroBar) {
        heroBar.addEventListener('input', clearFieldInvalid);
        heroBar.addEventListener('change', clearFieldInvalid);
        heroBar.addEventListener('focus', clearFieldInvalid, true);
        heroBar.addEventListener('click', clearFieldInvalid, true);
      }
      document.addEventListener('input', function(e) {
        if (e.target.closest('#transparent-search-form-home, #transparent-search-form-popup, .transparent-flight-search')) clearFieldInvalid(e);
      });
      document.addEventListener('change', function(e) {
        if (e.target.closest('#transparent-search-form-home, #transparent-search-form-popup, .transparent-flight-search')) clearFieldInvalid(e);
      });
      document.addEventListener('focus', function(e) {
        if (e.target.closest('#transparent-search-form-home, #transparent-search-form-popup, .transparent-flight-search')) clearFieldInvalid(e);
      }, true);
      document.addEventListener('click', function(e) {
        if (e.target.closest('#transparent-search-form-home, #transparent-search-form-popup, .transparent-flight-search')) clearFieldInvalid(e);
      }, true);
    })();

    // Flight results filter tabs
    (function initFilterTabs() {
      var filterTabs = document.querySelectorAll('.filter-tab');
      var currentFilter = 'best';
      var cachedData = null;

      filterTabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
          var filter = this.getAttribute('data-filter');
          if (filter === currentFilter) return;
          
          currentFilter = filter;
          filterTabs.forEach(function(t) { t.classList.remove('active'); });
          this.classList.add('active');
          
          if (cachedData && cachedData.data && cachedData.data.length > 0) {
            sortAndDisplayResults(cachedData, filter);
          }
        });
      });

      function sortAndDisplayResults(data, filter) {
        var sorted = (data.data || []).slice();
        
        if (filter === 'cheapest') {
          sorted.sort(function(a, b) {
            return parseFloat(a.price.total) - parseFloat(b.price.total);
          });
        } else if (filter === 'quickest') {
          sorted.sort(function(a, b) {
            var durationA = a.itineraries[0].duration || 'PT999H';
            var durationB = b.itineraries[0].duration || 'PT999H';
            return durationA.localeCompare(durationB);
          });
        } else {
          // 'best' - balanced score (price + duration)
          sorted.sort(function(a, b) {
            var scoreA = parseFloat(a.price.total) + (parseDuration(a.itineraries[0].duration) / 60);
            var scoreB = parseFloat(b.price.total) + (parseDuration(b.itineraries[0].duration) / 60);
            return scoreA - scoreB;
          });
        }
        
        var listEl = document.getElementById('flight-results-list-popup');
        if (listEl) renderFlights({ data: sorted, dictionaries: data.dictionaries || {} }, listEl, '');
      }

      function parseDuration(duration) {
        if (!duration) return 999;
        var match = duration.match(/PT(\d+)H(\d+)?M?/);
        if (!match) return 999;
        var hours = parseInt(match[1] || 0);
        var minutes = parseInt(match[2] || 0);
        return hours * 60 + minutes;
      }

      function formatPrice(price, currency) {
        var num = parseInt(price, 10);
        return (currency || 'Rs') + num.toLocaleString();
      }

      function updateTabPrices(results) {
        if (!results || results.length === 0) {
          document.getElementById('filter-cheapest-price').textContent = '-';
          document.getElementById('filter-best-price').textContent = '-';
          document.getElementById('filter-quickest-price').textContent = '-';
          return;
        }

        var currency = results[0].price.currency || 'Rs';

        // Cheapest - lowest price
        var cheapest = results.slice().sort(function(a, b) {
          return parseFloat(a.price.total) - parseFloat(b.price.total);
        })[0];
        
        // Quickest - shortest duration
        var quickest = results.slice().sort(function(a, b) {
          var durationA = a.itineraries[0].duration || 'PT999H';
          var durationB = b.itineraries[0].duration || 'PT999H';
          return durationA.localeCompare(durationB);
        })[0];
        
        // Best - balanced score
        var best = results.slice().sort(function(a, b) {
          var scoreA = parseFloat(a.price.total) + (parseDuration(a.itineraries[0].duration) / 60);
          var scoreB = parseFloat(b.price.total) + (parseDuration(b.itineraries[0].duration) / 60);
          return scoreA - scoreB;
        })[0];

        document.getElementById('filter-cheapest-price').textContent = formatPrice(cheapest.price.total, currency);
        document.getElementById('filter-best-price').textContent = formatPrice(best.price.total, currency);
        document.getElementById('filter-quickest-price').textContent = formatPrice(quickest.price.total, currency);
      }

      window.setCachedResults = function(data) {
        cachedData = data;
        var results = data && data.data ? data.data : [];
        updateTabPrices(results);
      };

      window.getCurrentFilter = function() {
        return currentFilter;
      };
    })();

    (function initInlineFilters() {
      var DEPARTURE_RANGES = {
        'morning': { min: 5, max: 11 },
        'noon': { min: 12, max: 13 },
        'afternoon': { min: 14, max: 17 },
        'evening': { min: 18, max: 20 },
        'late-night': { min: 21, max: 4 }
      };
      function getDepHour(depAt) {
        if (!depAt || depAt.length < 16) return -1;
        var h = parseInt(depAt.slice(11, 13), 10);
        return isNaN(h) ? -1 : h;
      }
      function flightInDepartureRange(flight, rangeKey) {
        var r = DEPARTURE_RANGES[rangeKey];
        if (!r) return true;
        var h = getDepHour((flight.itineraries && flight.itineraries[0] && flight.itineraries[0].segments && flight.itineraries[0].segments[0] && flight.itineraries[0].segments[0].departure) ? flight.itineraries[0].segments[0].departure.at : '');
        if (h < 0) return true;
        if (r.min <= r.max) return h >= r.min && h <= r.max;
        return h >= r.min || h <= r.max;
      }
      function getCarrierCode(flight) {
        var seg = flight.itineraries && flight.itineraries[0] && flight.itineraries[0].segments && flight.itineraries[0].segments[0];
        return (flight.validatingAirlineCodes && flight.validatingAirlineCodes[0]) || (seg && seg.carrierCode) || '';
      }
      window.applyInlineFiltersAndRender = function() {
        var data = window.cachedInlineResults;
        var listEl = document.getElementById('flight-results-list');
        if (!data || !listEl) return;
        var flights = (data.data || []).slice();
        var airlineEls = document.querySelectorAll('input[name="filter-airline"]:checked');
        var airlineVals = [].map.call(airlineEls, function(el) { return el.value; });
        if (airlineVals.length > 0) {
          flights = flights.filter(function(f) { return airlineVals.indexOf(getCarrierCode(f)) >= 0; });
        }
        var depSel = document.getElementById('filter-departure-time');
        var depVal = depSel ? depSel.value : '';
        if (depVal) {
          flights = flights.filter(function(f) { return flightInDepartureRange(f, depVal); });
        }
        var sortSel = document.getElementById('filter-sort-by');
        var sortVal = sortSel ? sortSel.value : 'price-low';
        if (sortVal === 'price-high') {
          flights.sort(function(a, b) { return parseFloat(b.price.total || 0) - parseFloat(a.price.total || 0); });
        } else {
          flights.sort(function(a, b) { return parseFloat(a.price.total || 0) - parseFloat(b.price.total || 0); });
        }
        renderFlights({ data: flights, dictionaries: data.dictionaries || {}, meta: data.meta }, listEl, '', true);
      };
      document.querySelectorAll('input[name="filter-airline"]').forEach(function(el) {
        el.addEventListener('change', function() { window.applyInlineFiltersAndRender(); });
      });
      var sortEl = document.getElementById('filter-sort-by');
      if (sortEl) sortEl.addEventListener('change', function() { window.applyInlineFiltersAndRender(); });
      var depEl = document.getElementById('filter-departure-time');
      if (depEl) depEl.addEventListener('change', function() { window.applyInlineFiltersAndRender(); });
    })();

    (function initFlightResultsPopup() {
      var popup = document.getElementById('flight-results-popup');
      var backdrop = popup ? popup.querySelector('.flight-results-popup-backdrop') : null;
      var closeBtn = popup ? popup.querySelector('.flight-results-popup-close') : null;

      function closePopup() {
        if (popup) {
          popup.classList.remove('visible');
          popup.setAttribute('aria-hidden', 'true');
          document.body.style.overflow = '';
        }
      }

      if (backdrop) backdrop.addEventListener('click', closePopup);
      if (closeBtn) closeBtn.addEventListener('click', closePopup);

      window.showFlightResultsPopup = function() {
        if (popup) {
          popup.classList.add('visible');
          popup.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
        }
      };
      window.closeFlightResultsPopup = closePopup;
    })();

    var searchForm = document.getElementById('flight-search-form');
    if (searchForm) searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      clearValidationState();
      if (!validateFlightSearch()) return;

      var tripType = document.querySelector('input[name="trip"]:checked');
      var isMulti = tripType && tripType.value === 'multicity';

      var fromVal = document.getElementById('from').value;
      var toVal = document.getElementById('to').value;
      var depDate = document.getElementById('departure').value;
      var adults = document.getElementById('passengers-adults').value || '1';

      var originCode = extractCode(fromVal);
      var destCode = extractCode(toVal);
      var destName = toVal ? toVal.split('(')[0].trim() : '';

      if (isMulti) {
        var seg0 = document.querySelector('.flight-search-segment[data-segment="0"]');
        var mcFrom = seg0 ? seg0.querySelector('.mc-from') : null;
        var mcTo = seg0 ? seg0.querySelector('.mc-to') : null;
        var mcDate0 = document.getElementById('mc-date-0');
        if (mcFrom && mcTo && mcDate0) {
          originCode = extractCode(mcFrom.value);
          destCode = extractCode(mcTo.value);
          depDate = mcDate0.value;
          destName = mcTo.value ? mcTo.value.split('(')[0].trim() : '';
        }
        adults = document.getElementById('mc-passengers-adults').value || '1';
      }

      var directOnlyEl = document.getElementById('direct-flights-only');
      var directOnly = directOnlyEl && directOnlyEl.checked;

      var resultsSection = document.getElementById('flight-results');
      var listEl = document.getElementById('flight-results-list');
      var headingEl = document.getElementById('flight-results-heading');
      var subEl = document.getElementById('flight-results-sub');
      var loadingOverlay = document.getElementById('flight-search-loading-overlay');
      var btn = document.querySelector('.btn-search-flight');
      var heroBtn = document.getElementById('hero-search-btn');

      if (headingEl) headingEl.textContent = originCode + ' \u2192 ' + destCode;
      if (subEl) subEl.textContent = directOnly ? 'Direct flights only' : '';
      listEl.innerHTML = '';
      var gridEl = document.getElementById('flight-results-dates-grid');
      if (gridEl) gridEl.innerHTML = '';
      document.querySelectorAll('input[name="filter-airline"]').forEach(function(cb) { cb.checked = false; });
      var sortSel = document.getElementById('filter-sort-by');
      if (sortSel) sortSel.value = 'price-low';
      var depSel = document.getElementById('filter-departure-time');
      if (depSel) depSel.value = '';
      if (resultsSection) resultsSection.style.display = 'none';
      if (loadingOverlay) { loadingOverlay.style.display = 'flex'; loadingOverlay.classList.add('visible'); }
      if (btn) { btn.disabled = true; btn.textContent = 'Searching...'; }
      if (heroBtn) { heroBtn.disabled = true; heroBtn.textContent = 'Searching...'; }

      var url = (typeof API_BASE !== 'undefined' ? API_BASE : (window.location.protocol === 'http:' || window.location.protocol === 'https:' ? window.location.origin : 'http://localhost:3000')) + '/api/flight-search-csv?originCode=' + encodeURIComponent(originCode) + '&destinationCode=' + encodeURIComponent(destCode) + '&dateOfDeparture=' + encodeURIComponent(depDate) + '&adults=' + encodeURIComponent(adults);
      if (directOnly) url += '&directOnly=1';

      fetch(url).then(function(r) { return r.json(); }).then(function(data) {
        setTimeout(function() {
          if (loadingOverlay) { loadingOverlay.style.display = 'none'; loadingOverlay.classList.remove('visible'); }
          if (btn) { btn.disabled = false; btn.textContent = 'Search'; }
          if (heroBtn) { heroBtn.disabled = false; heroBtn.textContent = 'Search'; }
          var homeMiddle = document.getElementById('home-middle-content');
          if (homeMiddle) homeMiddle.style.display = 'none';
          if (resultsSection) resultsSection.style.display = 'block';
          var count = (data.data && data.data.length) ? data.data.length : 0;
          if (headingEl) headingEl.textContent = count + ' Flights Found for ' + originCode + ' \u2192 ' + destCode;
          renderDatesGrid(originCode, destCode, depDate, data);
          if (typeof window.applyInlineFiltersAndRender === 'function') {
            window.cachedInlineResults = data;
            window.applyInlineFiltersAndRender();
          } else {
            renderFlights(data, listEl, destName);
          }
          resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 2000);
      }).catch(function() {
        if (loadingOverlay) { loadingOverlay.style.display = 'none'; loadingOverlay.classList.remove('visible'); }
        if (btn) { btn.disabled = false; btn.textContent = 'Search'; }
        if (heroBtn) { heroBtn.disabled = false; heroBtn.textContent = 'Search'; }
        var homeMiddle = document.getElementById('home-middle-content');
        if (homeMiddle) homeMiddle.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'block';
        listEl.innerHTML = '<p class="flight-results-empty">Cannot load results. Make sure the server is running (node server/app.js).</p>';
        var gridEl = document.getElementById('flight-results-dates-grid');
        if (gridEl) gridEl.innerHTML = '';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    (function() {
      var MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      var DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

      function fmtDate(y, m, d) {
        var g = new Date(y, m, d);
        if (isNaN(g.getTime())) return '';
        return ('0' + g.getDate()).slice(-2) + ' ' + MONTHS_SHORT[g.getMonth()] + ' ' + g.getFullYear();
      }
      function fmtDateWithDay(y, m, d) {
        var g = new Date(y, m, d);
        if (isNaN(g.getTime())) return '';
        return DAYS_SHORT[g.getDay()] + ', ' + ('0' + g.getDate()).slice(-2) + ' ' + MONTHS_SHORT[g.getMonth()] + ' ' + g.getFullYear();
      }
      function ymd(s) {
        if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
        var p = s.split('-').map(Number);
        return { y: p[0], m: p[1] - 1, d: p[2] };
      }
      function toYMD(d) {
        var y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
        return y + '-' + ('0' + (m + 1)).slice(-2) + '-' + ('0' + day).slice(-2);
      }
      function getTodayYMD() { return toYMD(new Date()); }
      function setTrigger(trigger, val, placeholder, useDayFormat) {
        var span = trigger && trigger.querySelector('.ek-date-trigger-text');
        if (!span) return;
        if (val) {
          var x = ymd(val);
          var fmt = (useDayFormat || (trigger && trigger.id === 'hero-date-trigger')) ? fmtDateWithDay : fmtDate;
          span.textContent = x ? fmt(x.y, x.m, x.d) : val;
          trigger.classList.remove('placeholder');
        } else {
          span.textContent = placeholder || 'Please choose date';
          trigger.classList.add('placeholder');
        }
      }
      function updateRangeTriggerText() {
        var depEl = document.getElementById('departure');
        var dep = depEl ? depEl.value : '';
        var heroTrig = document.getElementById('hero-date-trigger');
        if (heroTrig) setTrigger(heroTrig, dep || '', 'Select date');
      }

      (function initTodayAsDefault() {
        var dep = document.getElementById('departure');
        var mc0 = document.getElementById('mc-date-0');
        if (mc0 && !mc0.value) {
          mc0.value = dep && dep.value ? dep.value : getTodayYMD();
        }
        updateRangeTriggerText();
      })();

      var heroDateTrigger = document.getElementById('hero-date-trigger');
      if (heroDateTrigger) {
        heroDateTrigger.addEventListener('click', function(e) {
          e.preventDefault();
          var travelDate = document.getElementById('transparent-depart-date-home');
          if (travelDate) travelDate.focus();
        });
      }

      var card = document.querySelector('.flight-search-card');
      var datesCombined = document.getElementById('dates-combined');
      var tripRadios = document.querySelectorAll('input[name="trip"]');
      function updateTripType() {
        var sel = document.querySelector('input[name="trip"]:checked');
        if (!card || !sel) return;
        card.classList.remove('one-way', 'multicity');
        if (datesCombined) datesCombined.classList.remove('one-way');
        var lab = datesCombined ? datesCombined.querySelector('label') : null;
        if (sel.value === 'oneway') {
          card.classList.add('one-way');
          if (datesCombined) datesCombined.classList.add('one-way');
          if (lab) lab.textContent = 'Departing';
        } else {
          if (lab) lab.textContent = 'Departing – Returning';
          if (sel.value === 'multicity') card.classList.add('multicity');
        }
        updateRangeTriggerText();
      }
      tripRadios.forEach(function(r) { r.addEventListener('change', updateTripType); });
      updateTripType();

      (function initPassengersDropdown() {
        var dropdown = document.getElementById('passengers-dropdown');
        if (dropdown && dropdown.parentElement !== document.body) {
          document.body.appendChild(dropdown);
        }
        var triggerMain = document.getElementById('passengers-trigger');
        var triggerMc = document.getElementById('mc-passengers-trigger');
        var adultMinus = document.getElementById('pax-adult-minus');
        var adultPlus = document.getElementById('pax-adult-plus');
        var adultVal = document.getElementById('pax-adult-val');
        var adultLabel = document.getElementById('pax-adult-label');
        var childMinus = document.getElementById('pax-child-minus');
        var childPlus = document.getElementById('pax-child-plus');
        var childVal = document.getElementById('pax-child-val');
        var childLabel = document.getElementById('pax-child-label');
        var infantMinus = document.getElementById('pax-infant-minus');
        var infantPlus = document.getElementById('pax-infant-plus');
        var infantVal = document.getElementById('pax-infant-val');
        var infantLabel = document.getElementById('pax-infant-label');
        var activeTrigger = null;
        var activePrefix = '';

        function getInputs(prefix) {
          return {
            adults: document.getElementById(prefix + 'passengers-adults'),
            children: document.getElementById(prefix + 'passengers-children'),
            infants: document.getElementById(prefix + 'passengers-infants')
          };
        }

        function getCounts(prefix) {
          var i = getInputs(prefix);
          return {
            adults: parseInt((i.adults && i.adults.value) || '1', 10) || 1,
            children: parseInt((i.children && i.children.value) || '0', 10) || 0,
            infants: parseInt((i.infants && i.infants.value) || '0', 10) || 0
          };
        }

        function setCounts(prefix, a, c, inf) {
          var i = getInputs(prefix);
          if (i.adults) i.adults.value = String(a);
          if (i.children) i.children.value = String(c);
          if (i.infants) i.infants.value = String(inf);
        }

        function formatTriggerText(a, c, inf) {
          var parts = [];
          if (a) parts.push(a === 1 ? '1 Adult' : a + ' Adults');
          if (c) parts.push(c === 1 ? '1 Child' : c + ' Children');
          if (inf) parts.push(inf === 1 ? '1 Infant' : inf + ' Infants');
          return parts.length ? parts.join(', ') : '1 Adult';
        }

        function syncDropdownFromCounts(a, c, inf) {
          adultVal.textContent = String(a);
          adultLabel.textContent = a === 1 ? '1 Adult' : a + ' Adults';
          childVal.textContent = String(c);
          childLabel.textContent = c === 0 ? '0 Child' : (c === 1 ? '1 Child' : c + ' Children');
          infantVal.textContent = String(inf);
          infantLabel.textContent = inf === 0 ? '0 Infant' : (inf === 1 ? '1 Infant' : inf + ' Infants');
          adultMinus.disabled = a <= 1;
          adultPlus.disabled = a >= 9 || (a + c + inf) >= 9;
          childMinus.disabled = c <= 0;
          childPlus.disabled = (a + c + inf) >= 9;
          infantMinus.disabled = inf <= 0;
          infantPlus.disabled = inf >= a || (a + c + inf) >= 9;
        }

        function updateTriggerText() {
          if (!activeTrigger) return;
          var cnt = getCounts(activePrefix);
          activeTrigger.textContent = formatTriggerText(cnt.adults, cnt.children, cnt.infants);
        }

        var passengersOpenTime = 0;
        function openFor(trigger, prefix) {
          if (!dropdown || !trigger) return;
          if (typeof window.closeClassDropdown === 'function') window.closeClassDropdown();
          activeTrigger = trigger;
          activePrefix = prefix;
          passengersOpenTime = Date.now();
          var cnt = getCounts(prefix);
          syncDropdownFromCounts(cnt.adults, cnt.children, cnt.infants);
          var rect = trigger.getBoundingClientRect();
          dropdown.style.top = (rect.bottom + 4) + 'px';
          dropdown.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 296)) + 'px';
          dropdown.classList.add('open');
          dropdown.style.display = 'block';
          trigger.setAttribute('aria-expanded', 'true');
          document.body.style.overflow = 'hidden';
        }

        function close() {
          if (!dropdown) return;
          dropdown.classList.remove('open');
          dropdown.style.display = 'none';
          if (activeTrigger) activeTrigger.setAttribute('aria-expanded', 'false');
          activeTrigger = null;
          activePrefix = '';
          document.body.style.overflow = '';
        }
        window.closePassengersDropdown = close;

        function change(delta, type) {
          if (!activePrefix) return;
          var cnt = getCounts(activePrefix);
          if (type === 'adult') {
            cnt.adults = Math.max(1, Math.min(9, cnt.adults + delta));
            if (cnt.infants > cnt.adults) cnt.infants = cnt.adults;
          } else if (type === 'child') {
            cnt.children = Math.max(0, Math.min(9, cnt.children + delta));
          } else if (type === 'infant') {
            cnt.infants = Math.max(0, Math.min(cnt.adults, cnt.infants + delta));
          }
          var total = cnt.adults + cnt.children + cnt.infants;
          if (total > 9) {
            if (type === 'adult') cnt.adults = 9 - cnt.children - cnt.infants;
            else if (type === 'child') cnt.children = 9 - cnt.adults - cnt.infants;
            else cnt.infants = 9 - cnt.adults - cnt.children;
          }
          setCounts(activePrefix, cnt.adults, cnt.children, cnt.infants);
          syncDropdownFromCounts(cnt.adults, cnt.children, cnt.infants);
          updateTriggerText();
        }

        if (triggerMain) triggerMain.addEventListener('click', function(e) {
          e.preventDefault();
          if (dropdown.classList.contains('open') && activeTrigger === this) { close(); return; }
          openFor(this, '');
        });
        var triggerHero = document.getElementById('hero-passengers-trigger');
        if (triggerHero) {
          triggerHero.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (dropdown.classList.contains('open') && activeTrigger === this) { close(); return; }
            openFor(this, '');
          });
          triggerHero.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); });
        }
        if (triggerMc) triggerMc.addEventListener('click', function(e) {
          e.preventDefault();
          if (dropdown.classList.contains('open') && activeTrigger === this) { close(); return; }
          openFor(this, 'mc-');
        });

        function bindPaxBtn(btn, delta, type) {
          if (!btn) return;
          btn.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();
            change(delta, type);
          });
        }
        bindPaxBtn(adultMinus, -1, 'adult');
        bindPaxBtn(adultPlus, 1, 'adult');
        bindPaxBtn(childMinus, -1, 'child');
        bindPaxBtn(childPlus, 1, 'child');
        bindPaxBtn(infantMinus, -1, 'infant');
        bindPaxBtn(infantPlus, 1, 'infant');

        document.addEventListener('click', function(e) {
          if (!dropdown || !dropdown.classList.contains('open')) return;
          if (dropdown.contains(e.target)) return;
          var t = e.target;
          while (t && t !== document.body) {
            if (t === triggerMain || t === triggerMc || t === triggerHero) return;
            t = t.parentElement;
          }
          close();
        });

        var scrollCloseTimeout;
        window.addEventListener('scroll', function() {
          if (!dropdown || !dropdown.classList.contains('open')) return;
          if ((Date.now() - passengersOpenTime) < 300) return;
          clearTimeout(scrollCloseTimeout);
          scrollCloseTimeout = setTimeout(function() { close(); }, 50);
        }, true);

        if (triggerMain) triggerMain.textContent = formatTriggerText(getCounts('').adults, getCounts('').children, getCounts('').infants);
        if (triggerMc) triggerMc.textContent = formatTriggerText(getCounts('mc-').adults, getCounts('mc-').children, getCounts('mc-').infants);
        if (triggerHero) triggerHero.textContent = formatTriggerText(getCounts('').adults, getCounts('').children, getCounts('').infants);
      })();

      (function initClassDropdown() {
        var classDropdown = document.getElementById('class-dropdown');
        if (classDropdown && classDropdown.parentElement !== document.body) {
          document.body.appendChild(classDropdown);
        }
        var classTrigger = document.getElementById('hero-class-trigger');
        var formClassSelect = document.getElementById('class');
        var options = classDropdown ? classDropdown.querySelectorAll('.class-dropdown-option') : [];
        var displayMap = { 'Economy Class': 'Economy', 'Premium Economy': 'Premium Economy', 'Business Class': 'Business Class', 'First Class': 'First Class' };

        function closeClass() {
          if (!classDropdown) return;
          classDropdown.classList.remove('open');
          classDropdown.style.display = 'none';
          if (classTrigger) classTrigger.setAttribute('aria-expanded', 'false');
        }
        window.closeClassDropdown = closeClass;

        function openClass() {
          if (!classDropdown || !classTrigger) return;
          if (typeof window.closePassengersDropdown === 'function') window.closePassengersDropdown();
          var rect = classTrigger.getBoundingClientRect();
          classDropdown.style.top = (rect.bottom + 4) + 'px';
          classDropdown.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 196)) + 'px';
          classDropdown.classList.add('open');
          classDropdown.style.display = 'block';
          classTrigger.setAttribute('aria-expanded', 'true');
          options.forEach(function(opt) {
            opt.classList.toggle('selected', formClassSelect && opt.getAttribute('data-value') === formClassSelect.value);
          });
        }

        if (classTrigger) {
          classTrigger.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (classDropdown.classList.contains('open')) { closeClass(); return; }
            openClass();
          });
          classTrigger.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); });
        }

        options.forEach(function(opt) {
          opt.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var val = opt.getAttribute('data-value');
            if (formClassSelect) formClassSelect.value = val;
            if (classTrigger) classTrigger.textContent = displayMap[val] || val;
            options.forEach(function(o) { o.classList.remove('selected'); });
            opt.classList.add('selected');
            closeClass();
          });
        });

        document.addEventListener('click', function(e) {
          if (!classDropdown || !classDropdown.classList.contains('open')) return;
          if (classDropdown.contains(e.target)) return;
          if (classTrigger && (e.target === classTrigger || classTrigger.contains(e.target))) return;
          var t = e.target;
          while (t && t !== document.body) {
            if (t === classTrigger) return;
            t = t.parentElement;
          }
          closeClass();
        });

        var classScrollTimeout;
        window.addEventListener('scroll', function() {
          if (!classDropdown || !classDropdown.classList.contains('open')) return;
          clearTimeout(classScrollTimeout);
          classScrollTimeout = setTimeout(closeClass, 50);
        }, true);

        if (classTrigger && formClassSelect) {
          classTrigger.textContent = displayMap[formClassSelect.value] || formClassSelect.value || 'Economy';
        }
      })();

      var addSegmentBtn = document.getElementById('add-segment');
      var segmentsContainer = document.getElementById('multicity-segments');
      var segmentIndex = 2;
      function pickDateForMulticity(triggerEl, hiddenEl) {
        if (!hiddenEl) return;
        var current = hiddenEl.value || '';
        var entered = window.prompt('Enter date (YYYY-MM-DD)', current);
        if (entered === null) return;
        var value = (entered || '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
        var d = new Date(value + 'T00:00:00');
        if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) return;
        hiddenEl.value = value;
        if (typeof setTrigger === 'function' && triggerEl) setTrigger(triggerEl, value, 'Please choose date');
      }
      function addSegment() {
        var flightNum = document.querySelectorAll('.flight-search-segment').length + 1;
        var seg = document.querySelector('.flight-search-segment');
        if (!seg || !segmentsContainer) return;
        var clone = seg.cloneNode(true);
        clone.setAttribute('data-segment', segmentIndex);
        clone.querySelector('.flight-search-segment-label').textContent = 'Flight ' + flightNum;
        clone.querySelector('.mc-from').value = '';
        clone.querySelector('.mc-to').value = '';
        clone.querySelectorAll('.airport-autocomplete').forEach(function(wrap) {
          var inp = wrap.querySelector('.airport-input');
          var dd = wrap.querySelector('.airport-dropdown');
          if (inp && dd) initAirportAutocomplete(inp, dd);
        });
        var dateWrap = clone.querySelector('.ek-date-wrap');
        var id = 'mc-date-' + segmentIndex;
        var trig = dateWrap.querySelector('.ek-date-trigger');
        var hid = dateWrap.querySelector('.mc-date-input');
        if (trig) { trig.setAttribute('data-target', id); trig.setAttribute('data-segment', segmentIndex); trig.querySelector('.ek-date-trigger-text').textContent = 'Please choose date'; trig.classList.add('placeholder'); }
        if (hid) { hid.id = id; hid.name = id; hid.value = ''; }
        dateWrap.querySelector('.ek-date-trigger').addEventListener('click', function(e) {
          e.preventDefault();
          pickDateForMulticity(this, hid);
        });
        segmentsContainer.insertBefore(clone, addSegmentBtn);
        segmentIndex++;
      }
      function wireMcDates() {
        document.querySelectorAll('.flight-search-segment .ek-date-trigger.mc-date').forEach(function(trig) {
          var tid = trig.getAttribute('data-target');
          var hid = document.getElementById(tid);
          if (hid) setTrigger(trig, hid.value, 'Please choose date');
        });
      }
      wireMcDates();
      document.querySelectorAll('.flight-search-segment .ek-date-trigger.mc-date').forEach(function(trig) {
        var tid = trig.getAttribute('data-target');
        trig.addEventListener('click', function(e) {
          e.preventDefault();
          pickDateForMulticity(trig, document.getElementById(tid));
        });
      });
      if (addSegmentBtn) addSegmentBtn.addEventListener('click', addSegment);

      /* Hero search bar - sync with main form and submit */
      (function initHeroSearchBar() {
        var heroSwap = document.getElementById('hero-swap');
        var heroSearchBtn = document.getElementById('hero-search-btn');
        var fromHero = document.getElementById('from-hero');
        var toHero = document.getElementById('to-hero');
        var fromMain = document.getElementById('from');
        var toMain = document.getElementById('to');
        var tripHero = document.querySelectorAll('input[name="trip-hero"]');
        var tripMain = document.querySelectorAll('input[name="trip"]');
        var directHero = document.getElementById('direct-hero');
        var directMain = document.getElementById('direct-flights-only');

        if (heroSwap && fromHero && toHero) {
          heroSwap.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var tmp = fromHero.value;
            fromHero.value = toHero.value;
            toHero.value = tmp;
            if (fromMain) fromMain.value = fromHero.value;
            if (toMain) toMain.value = toHero.value;
          });
        }
        var heroDatePrev = document.getElementById('hero-date-prev');
        var heroDateNext = document.getElementById('hero-date-next');
        var heroDateTrigger = document.getElementById('hero-date-trigger');
        var depEl = document.getElementById('departure');
        if (heroDatePrev && heroDateNext && heroDateTrigger && depEl) {
          function addDays(ymdStr, delta) {
            if (!ymdStr) ymdStr = getTodayYMD();
            var p = ymd(ymdStr);
            if (!p) return ymdStr;
            var d = new Date(p.y, p.m, p.d + delta);
            return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
          }
          heroDatePrev.addEventListener('click', function() {
            var cur = depEl.value || getTodayYMD();
            var prev = addDays(cur, -1);
            if (prev >= getTodayYMD()) {
              depEl.value = prev;
              setTrigger(heroDateTrigger, prev, 'Select date');
              updateRangeTriggerText();
            }
          });
          heroDateNext.addEventListener('click', function() {
            var cur = depEl.value || getTodayYMD();
            depEl.value = addDays(cur, 1);
            setTrigger(heroDateTrigger, depEl.value, 'Select date');
            updateRangeTriggerText();
          });
        }
        if (tripHero.length && tripMain.length) {
          tripHero.forEach(function(r) {
            r.addEventListener('change', function() {
              var main = document.querySelector('input[name="trip"][value="' + this.value + '"]');
              if (main) { main.checked = true; main.dispatchEvent(new Event('change', { bubbles: true })); }
            });
          });
          tripMain.forEach(function(r) {
            r.addEventListener('change', function() {
              var hero = document.querySelector('input[name="trip-hero"][value="' + this.value + '"]');
              if (hero) hero.checked = true;
            });
          });
        }
        if (directHero && directMain) {
          directHero.addEventListener('change', function() { directMain.checked = directHero.checked; });
          directMain.addEventListener('change', function() { directHero.checked = directMain.checked; });
        }
        if (fromMain && fromHero) {
          fromMain.addEventListener('input', function() { fromHero.value = fromMain.value; });
          fromMain.addEventListener('change', function() { fromHero.value = fromMain.value; });
        }
        if (toMain && toHero) {
          toMain.addEventListener('input', function() { toHero.value = toMain.value; });
          toMain.addEventListener('change', function() { toHero.value = toMain.value; });
        }
        if (heroSearchBtn) {
          heroSearchBtn.addEventListener('click', function() {
            var tripHeroChecked = document.querySelector('input[name="trip-hero"]:checked');
            var isMulti = tripHeroChecked && tripHeroChecked.value === 'multicity';
            if (fromHero) fromMain.value = fromHero.value;
            if (toHero) toMain.value = toHero.value;
            if (directHero && directMain) directMain.checked = directHero.checked;
            if (tripHeroChecked && tripMain.length) {
              var mainRadio = document.querySelector('input[name="trip"][value="' + tripHeroChecked.value + '"]');
              if (mainRadio) { mainRadio.checked = true; }
            }
            if (isMulti) {
              var seg0 = document.querySelector('.flight-search-segment[data-segment="0"]');
              var mcFrom = seg0 ? seg0.querySelector('.mc-from') : null;
              var mcTo = seg0 ? seg0.querySelector('.mc-to') : null;
              var mcDate0 = document.getElementById('mc-date-0');
              var depEl = document.getElementById('departure');
              if (mcFrom && fromHero) mcFrom.value = fromHero.value;
              if (mcTo && toHero) mcTo.value = toHero.value;
              if (mcDate0 && depEl) mcDate0.value = depEl.value || '';
            }
            var form = document.getElementById('flight-search-form');
            if (form) form.requestSubmit();
          });
        }
      })();
    })();