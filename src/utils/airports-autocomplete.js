/**
 * Airport autocomplete for From/To fields - uses mainairports.json (embedded).
 * Dropdown displays: Airport Name | IATA Code | City
 * Click or focus: show full list. Type to filter by IATA, city, name, country.
 */
(function() {
  var searchTimeout = null;

  /* Pre-compiled airport list from mainairports.json - always available, no fetch */
  var AIRPORTS_LIST = [{"country":"Pakistan","city":"Islamabad","name":"Islamabad International Airport","iataCode":"ISB"},{"country":"Pakistan","city":"Karachi","name":"Jinnah International Airport","iataCode":"KHI"},{"country":"Pakistan","city":"Lahore","name":"Allama Iqbal International Airport","iataCode":"LHE"},{"country":"Pakistan","city":"Peshawar","name":"Bacha Khan International Airport","iataCode":"PEW"},{"country":"Pakistan","city":"Sialkot","name":"Sialkot International Airport","iataCode":"SKT"},{"country":"Pakistan","city":"Multan","name":"Multan International Airport","iataCode":"MUX"},{"country":"Pakistan","city":"Quetta","name":"Quetta International Airport","iataCode":"UET"},{"country":"Pakistan","city":"Skardu","name":"Skardu International Airport","iataCode":"KDU"},{"country":"Pakistan","city":"Faisalabad","name":"Faisalabad International Airport","iataCode":"LYP"},{"country":"UAE","city":"Dubai","name":"Dubai International Airport","iataCode":"DXB"},{"country":"UAE","city":"Dubai","name":"Al Maktoum International Airport","iataCode":"DWC"},{"country":"UAE","city":"Abu Dhabi","name":"Zayed International Airport","iataCode":"AUH"},{"country":"UAE","city":"Sharjah","name":"Sharjah International Airport","iataCode":"SHJ"},{"country":"UAE","city":"Ras Al Khaimah","name":"Ras Al Khaimah International Airport","iataCode":"RKT"},{"country":"UAE","city":"Fujairah","name":"Fujairah International Airport","iataCode":"FJR"},{"country":"United Kingdom","city":"London","name":"Heathrow Airport","iataCode":"LHR"},{"country":"United Kingdom","city":"London","name":"Gatwick Airport","iataCode":"LGW"},{"country":"United Kingdom","city":"Manchester","name":"Manchester Airport","iataCode":"MAN"},{"country":"United Kingdom","city":"Birmingham","name":"Birmingham Airport","iataCode":"BHX"},{"country":"United Kingdom","city":"Glasgow","name":"Glasgow Airport","iataCode":"GLA"},{"country":"United Kingdom","city":"Edinburgh","name":"Edinburgh Airport","iataCode":"EDI"},{"country":"Oman","city":"Muscat","name":"Muscat International Airport","iataCode":"MCT"},{"country":"Oman","city":"Salalah","name":"Salalah Airport","iataCode":"SLL"},{"country":"Oman","city":"Duqm","name":"Duqm International Airport","iataCode":"DQM"},{"country":"Qatar","city":"Doha","name":"Hamad International Airport","iataCode":"DOH"},{"country":"Kuwait","city":"Kuwait City","name":"Kuwait International Airport","iataCode":"KWI"},{"country":"Turkey","city":"Istanbul","name":"Istanbul Airport","iataCode":"IST"},{"country":"Turkey","city":"Istanbul","name":"Sabiha Gokcen International Airport","iataCode":"SAW"},{"country":"Turkey","city":"Ankara","name":"Esenboga International Airport","iataCode":"ESB"},{"country":"Turkey","city":"Antalya","name":"Antalya Airport","iataCode":"AYT"},{"country":"Turkey","city":"Izmir","name":"Adnan Menderes Airport","iataCode":"ADB"},{"country":"Saudi Arabia","city":"Riyadh","name":"King Khalid International Airport","iataCode":"RUH"},{"country":"Saudi Arabia","city":"Jeddah","name":"King Abdulaziz International Airport","iataCode":"JED"},{"country":"Saudi Arabia","city":"Dammam","name":"King Fahd International Airport","iataCode":"DMM"},{"country":"Saudi Arabia","city":"Madinah","name":"Prince Mohammad bin Abdulaziz Airport","iataCode":"MED"},{"country":"Saudi Arabia","city":"Abha","name":"Abha International Airport","iataCode":"AHB"},{"country":"Bahrain","city":"Manama","name":"Bahrain International Airport","iataCode":"BAH"}];

  function parseMainAirportsCSV(text) {
    var lines = (text || '').split(/\r?\n/).filter(Boolean);
    var result = [];
    for (var i = 1; i < lines.length; i++) {
      var cols = [];
      var cur = '';
      var inQ = false;
      for (var j = 0; j < lines[i].length; j++) {
        var c = lines[i][j];
        if (c === '"') inQ = !inQ;
        else if (c === ',' && !inQ) { cols.push(cur.replace(/^"|"$/g, '').trim()); cur = ''; }
        else cur += c;
      }
      cols.push(cur.replace(/^"|"$/g, '').trim());
      var country = (cols[0] || '').trim();
      var city = (cols[1] || '').trim();
      var name = (cols[2] || '').trim();
      var iata = (cols[3] || '').trim();
      if (!iata || iata === '\\N') continue;
      result.push({ name: name || city, city: city, country: country, iataCode: iata });
    }
    return result;
  }

  function parseCSVToAirports(text) {
    var lines = (text || '').split(/\r?\n/).filter(Boolean);
    var result = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var cols = [];
      var cur = '';
      var inQ = false;
      for (var j = 0; j < line.length; j++) {
        var c = line[j];
        if (c === '"') inQ = !inQ;
        else if (c === ',' && !inQ) { cols.push(cur.replace(/^"|"$/g, '').trim()); cur = ''; }
        else cur += c;
      }
      cols.push(cur.replace(/^"|"$/g, '').trim());
      var iata = (cols[4] || '').trim();
      if (!iata || iata === '\\N') continue;
      result.push({ name: (cols[1] || '').trim(), city: (cols[2] || '').trim(), country: (cols[3] || '').trim(), iataCode: iata });
    }
    return result;
  }

  function getAirportsList() {
    return AIRPORTS_LIST;
  }

  function filterAirports(list, q) {
    if (!list || !list.length) return [];
    if (!q || !q.trim()) return list.slice(0, 200);
    var k = q.toLowerCase().trim();
    var filtered = list.filter(function(a) {
      var name = (a.name || '').toLowerCase();
      var city = (a.city || '').toLowerCase();
      var country = (a.country || '').toLowerCase();
      var code = (a.iataCode || a.code || '').toLowerCase();
      return name.indexOf(k) >= 0 || city.indexOf(k) >= 0 || country.indexOf(k) >= 0 || code.indexOf(k) >= 0;
    });
    filtered.sort(function(a, b) {
      var codeA = (a.iataCode || a.code || '').toLowerCase();
      var codeB = (b.iataCode || b.code || '').toLowerCase();
      var matchA = codeA === k ? 0 : (codeA.indexOf(k) === 0 ? 1 : 2);
      var matchB = codeB === k ? 0 : (codeB.indexOf(k) === 0 ? 1 : 2);
      return matchA - matchB;
    });
    return filtered.slice(0, 150);
  }

  var ETIHAD_TAILFIN_ICON = 'https://www.etihad.com/content/dam/eag/etihadairways/etihad-shared/en/demo/icon-ey-tailfin.svg';

  function createDropdownHTML(items) {
    if (!items || !items.length) return '';
    return items.map(function(a) {
      var name = (a.name || '').replace(/"/g, '&quot;');
      var city = (a.city || '').replace(/"/g, '&quot;');
      var country = (a.country || '').replace(/"/g, '&quot;');
      var code = (a.iataCode || a.code || '').replace(/"/g, '&quot;');
      var cityCountry = country ? city + ', ' + country : city;
      var displayVal = city + ', ' + code;
      return '<div class="airport-dropdown-item airport-dropdown-row airport-dropdown-card" data-value="' + displayVal.replace(/"/g, '&quot;') + '" data-code="' + code + '">' +
        '<span class="airport-dropdown-icon"><i class="fa-solid fa-plane"></i></span>' +
        '<div class="airport-dropdown-content">' +
          '<div class="airport-dropdown-city">' + cityCountry + '</div>' +
          '<div class="airport-dropdown-name">' + name + '</div>' +
        '</div>' +
        '<strong class="airport-dropdown-code">' + code + '</strong>' +
        '</div>';
    }).join('');
  }

  function createEtihadDropdownHTML(items) {
    if (!items || !items.length) return '';
    return items.map(function(a, i) {
      var name = (a.name || '').replace(/"/g, '&quot;');
      var city = (a.city || '').replace(/"/g, '&quot;');
      var country = (a.country || '').replace(/"/g, '&quot;');
      var code = (a.iataCode || a.code || '').replace(/"/g, '&quot;');
      var displayVal = city + ', ' + code;
      var itemId = 'fsporigin-item-' + (1000 + i);
      return '<a href="javascript:void(0)" aria-selected="false" id="' + itemId + '" role="option" class="dropdown-item' + (i === 0 ? ' active' : '') + '" data-value="' + displayVal.replace(/"/g, '&quot;') + '" data-code="' + code + '">' +
        '<div class="ey-row dropdown-item--content ey-border-radius-8">' +
          '<div class="ey-column ey-text-start align-center ey-padding--none ey-align-center ey-column-xs-8">' +
            '<div class="ey-display--flex">' +
              '<div class="tailfin-icon operated-by">' +
                '<div class="ond-group-icons">' +
                  '<img src="' + ETIHAD_TAILFIN_ICON + '" alt="airport" class="w-32 visible">' +
                '</div>' +
              '</div>' +
              '<div class="ey-margin__left--8">' +
                '<div class="operated-by origin-typeahead-airportName-container ey-ond--typeahead-airportName-container">' +
                  '<span class="origin-typeahead-airportName">' + city.replace(/"/g, '&quot;') + ',</span>' +
                  '<span class="origin-typeahead-airportCode"> ' + country.replace(/"/g, '&quot;') + '</span>' +
                '</div>' +
                '<div class="airport-grouping ey-ond--typeahead-airport-grouping">' +
                  '<div class="operated-by origin-typeahead-airportName-container">' +
                    '<span class="origin-typeahead-airportName">' + name + '</span>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="ey-column ey-text-end align-center ey-padding--none ey-align-center">' +
            '<div class="ey-chip--neutral ey-chip--no-icon ey-ond-chip ey-margin__left--8">' + code + '</div>' +
          '</div>' +
        '</div>' +
      '</a>';
    }).join('');
  }

  window.setupFromAirportPanel = function(inputEl, hiddenId) {
    if (!inputEl) return;
    if (inputEl.dataset.fromPanelReady === '1') return;
    inputEl.dataset.fromPanelReady = '1';
    var hiddenEl = document.getElementById(hiddenId);
    var container = inputEl.closest('.transparent-search-field');
    if (!container) container = inputEl.parentElement;

    var panel = document.createElement('div');
    panel.id = 'from-airport-panel';
    panel.className = 'from-airport-panel';
    panel.setAttribute('aria-hidden', 'true');
    document.body.appendChild(panel);

    function closePanel() {
      panel.classList.remove('open');
      panel.style.display = 'none';
      panel.setAttribute('aria-hidden', 'true');
    }

    function positionPanel() {
      var rect = inputEl.getBoundingClientRect();
      var searchArea = inputEl.closest('.transparent-home-search') || inputEl.closest('.transparent-flight-search');
      if (searchArea) {
        var sa = searchArea.getBoundingClientRect();
        panel.style.left = sa.left + 'px';
        panel.style.width = Math.min(380, Math.max(320, sa.width)) + 'px';
      } else {
        panel.style.left = Math.max(16, Math.min(rect.left, window.innerWidth - 396)) + 'px';
        panel.style.width = '380px';
      }
      panel.style.top = (rect.bottom + 4) + 'px';
      panel.style.maxHeight = 'calc(100vh - ' + (rect.bottom + 24) + 'px)';
    }

    function createRowHTML(items) {
      if (!items || !items.length) return '';
      return items.map(function(a) {
        var name = (a.name || '').replace(/"/g, '&quot;');
        var city = (a.city || '').replace(/"/g, '&quot;');
        var country = (a.country || '').replace(/"/g, '&quot;');
        var code = (a.iataCode || a.code || '').replace(/"/g, '&quot;');
        var cityCountry = country ? city + ', ' + country : city;
        var displayVal = city + ', ' + code;
        return '<div class="from-panel-row" data-value="' + displayVal.replace(/"/g, '&quot;') + '" data-code="' + code + '">' +
          '<span class="from-panel-icon"><i class="fa-solid fa-plane-departure"></i></span>' +
          '<div class="from-panel-content">' +
            '<div class="from-panel-city">' + cityCountry + '</div>' +
            '<div class="from-panel-name">' + name + '</div>' +
          '</div>' +
          '<span class="from-panel-code">' + code + '</span>' +
        '</div>';
      }).join('');
    }

    function showPanel(items) {
      panel.innerHTML = '<div class="from-panel-header">Depart from</div><div class="from-panel-list">' + createRowHTML(items) + '</div>';
      positionPanel();
      panel.style.display = 'block';
      panel.style.visibility = 'visible';
      panel.style.opacity = '1';
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
      panel.querySelectorAll('.from-panel-row').forEach(function(el) {
        el.addEventListener('mousedown', function(e) {
          e.preventDefault();
          e.stopPropagation();
          var val = el.getAttribute('data-value');
          var code = el.getAttribute('data-code');
          inputEl.value = val;
          inputEl.classList.remove('invalid');
          if (hiddenEl) hiddenEl.value = code;
          closePanel();
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          inputEl.dispatchEvent(new Event('change', { bubbles: true }));
          var fromMain = document.getElementById('from');
          if (fromMain) fromMain.value = val;
          var fromHero = document.getElementById('from-hero');
          if (fromHero) fromHero.value = val;
        });
      });
    }

    function doSearch(q) {
      if (airportsCache) {
        showPanel(filterAirports(airportsCache, q));
        return;
      }
      showPanel(filterAirports(STATIC_AIRPORTS, q));
      loadAirports().then(function(list) {
        showPanel(filterAirports(list, q));
      });
    }

    function openPanel() {
      document.querySelectorAll('.from-airport-panel.open, .airport-dropdown-transparent.open').forEach(function(el) {
        el.classList.remove('open');
        el.style.display = 'none';
      });
      var q = (inputEl.value || '').trim().replace(/\s*,\s*[A-Z]{3}\s*$/i, '').trim() || (inputEl.value || '').trim();
      doSearch(q);
    }
    var fieldWrapper = inputEl.closest('.etihad-field-from') || container;
    if (fieldWrapper) {
      fieldWrapper.addEventListener('mousedown', function(e) {
        if (e.target === inputEl || inputEl.contains(e.target)) return;
        e.preventDefault();
        inputEl.focus();
        setTimeout(openPanel, 0);
      });
    }
    inputEl.addEventListener('focus', openPanel);
    inputEl.addEventListener('mousedown', function() { setTimeout(openPanel, 0); }, { passive: true });

    inputEl.addEventListener('input', function() {
      var q = (inputEl.value || '').trim();
      if (!panel.classList.contains('open')) return;
      if (q.length < 1) {
        doSearch('');
        return;
      }
      setTimeout(function() { doSearch(q); }, 100);
    });

    inputEl.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closePanel();
    });

    inputEl.addEventListener('blur', function() {
      setTimeout(function() {
        if (document.activeElement !== inputEl && !panel.contains(document.activeElement)) {
          closePanel();
        }
      }, 200);
    });

    document.addEventListener('click', function(e) {
      if (!panel.classList.contains('open')) return;
      if ((container && container.contains(e.target)) || panel.contains(e.target)) return;
      closePanel();
    });

    window.addEventListener('scroll', function() {
      if (panel.classList.contains('open')) positionPanel();
    }, { passive: true, capture: true });
    window.addEventListener('resize', function() {
      if (panel.classList.contains('open')) positionPanel();
    });
  };

  window.setupAirportAutocomplete = function(inputEl, hiddenId, fromOrTo) {
    if (!inputEl) return;
    if (inputEl.dataset.airportAcReady === '1') return;
    inputEl.dataset.airportAcReady = '1';
    var hiddenEl = document.getElementById(hiddenId);
    var container = inputEl.closest('.transparent-search-field');
    if (!container) container = inputEl.parentElement;

    var dropdown = document.createElement('div');
    dropdown.className = 'airport-dropdown airport-dropdown-transparent airport-dropdown-from';
    dropdown.setAttribute('aria-expanded', 'false');
    document.body.appendChild(dropdown);

    function closeDropdown() {
      dropdown.classList.remove('open');
      dropdown.style.display = 'none';
      dropdown.setAttribute('aria-expanded', 'false');
    }

    function closeAllAirportDropdowns() {
      document.querySelectorAll('.airport-dropdown-transparent.open').forEach(function(el) {
        el.classList.remove('open');
        el.setAttribute('aria-expanded', 'false');
      });
    }

    function positionDropdown() {
      var rect = inputEl.getBoundingClientRect();
      var searchSection = inputEl.closest('.transparent-search-content') || inputEl.closest('.home-flight-search-wrap');
      var fieldContainer = inputEl.closest('.etihad-field-from') || inputEl.closest('.etihad-field-to');
      var anchor = fieldContainer ? fieldContainer.getBoundingClientRect() : rect;
      var w;
      var left;
      if (searchSection) {
        var sectionRect = searchSection.getBoundingClientRect();
        w = sectionRect.width;
        dropdown.classList.add('airport-dropdown-fullwidth');
        dropdown.style.left = sectionRect.left + 'px';
        dropdown.style.right = (window.innerWidth - sectionRect.right) + 'px';
        dropdown.style.width = sectionRect.width + 'px';
      } else {
        dropdown.classList.remove('airport-dropdown-fullwidth');
        w = Math.min(380, Math.max(280, anchor.width));
        left = Math.max(8, Math.min(anchor.left, window.innerWidth - w - 16));
        dropdown.style.left = left + 'px';
        dropdown.style.right = 'auto';
        dropdown.style.width = w + 'px';
      }
      dropdown.style.top = (rect.bottom + 4) + 'px';
      dropdown.style.maxHeight = 'calc(100vh - ' + (rect.bottom + 24) + 'px)';
    }

    function showResults(items) {
      closeAllAirportDropdowns();
      var headerText = fromOrTo === 'from' ? 'Depart from' : 'Arrive at';
      dropdown.innerHTML = '<div class="airport-dropdown-header">' + headerText + '</div>' + createDropdownHTML(items);
      positionDropdown();
      dropdown.style.display = 'block';
      dropdown.style.visibility = 'visible';
      dropdown.classList.add('open');
      dropdown.setAttribute('aria-expanded', 'true');
      var itemSelector = '.airport-dropdown-item[data-value]';
      dropdown.querySelectorAll(itemSelector).forEach(function(el) {
        // Use mousedown instead of click - mousedown fires before input blur,
        // so selection works when user clicks dropdown (blur would close it before click)
        el.addEventListener('mousedown', function(e) {
          e.preventDefault();
          e.stopPropagation();
          var val = el.getAttribute('data-value');
          var code = el.getAttribute('data-code');
          inputEl.value = val;
          inputEl.classList.remove('invalid');
          if (hiddenEl) hiddenEl.value = code;
          closeDropdown();
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          inputEl.dispatchEvent(new Event('change', { bubbles: true }));
          var fromMain = document.getElementById('from');
          var toMain = document.getElementById('to');
          if (fromOrTo === 'from' && fromMain) fromMain.value = val;
          if (fromOrTo === 'to' && toMain) toMain.value = val;
          var fromHero = document.getElementById('from-hero');
          var toHero = document.getElementById('to-hero');
          if (fromOrTo === 'from' && fromHero) fromHero.value = val;
          if (fromOrTo === 'to' && toHero) toHero.value = val;
        });
      });
    }

    function doSearch(q) {
      var list = getAirportsList();
      var filtered = filterAirports(list, q);
      showResults(filtered);
    }

    function onOpenDropdown() {
      clearTimeout(searchTimeout);
      var q = (inputEl.value || '').trim();
      if (q) inputEl.select();
      var searchQ = q ? (q.replace(/\s*,\s*[A-Z]{3}\s*$/i, '').trim() || q.split(',')[0].trim() || q) : '';
      doSearch(searchQ);
    }
    inputEl.addEventListener('focus', onOpenDropdown);
    inputEl.addEventListener('mousedown', function() {
      setTimeout(onOpenDropdown, 0);
    }, { passive: true });
    var typeaheadContainer = inputEl.closest('.ey-typeahead--container-ond--fsp') || inputEl.closest('#originContainer') || inputEl.closest('#destContainer') || container;
    if (typeaheadContainer && typeaheadContainer !== inputEl) {
      typeaheadContainer.addEventListener('mousedown', function(e) {
        if (e.target === inputEl || inputEl.contains(e.target)) return;
        e.preventDefault();
        inputEl.focus();
        setTimeout(onOpenDropdown, 0);
      });
    }

    inputEl.addEventListener('input', function() {
      var q = (inputEl.value || '').trim();
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(function() {
        doSearch(q);
      }, 80);
    });

    inputEl.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeDropdown();
    });

    inputEl.addEventListener('blur', function() {
      setTimeout(function() {
        if (document.activeElement !== inputEl && !dropdown.contains(document.activeElement)) {
          closeDropdown();
        }
      }, 200);
    });

    document.addEventListener('click', function(e) {
      if (!dropdown.classList.contains('open')) return;
      if ((container && container.contains(e.target)) || dropdown.contains(e.target)) return;
      closeDropdown();
    });

    var scrollRaf = null;
    function onScrollOrResize() {
      if (!dropdown.classList.contains('open')) return;
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(function() {
        scrollRaf = null;
        positionDropdown();
      });
    }
    window.addEventListener('scroll', onScrollOrResize, { passive: true, capture: true });
    window.addEventListener('resize', onScrollOrResize);
  };
})();
