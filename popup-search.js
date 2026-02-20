// Popup Search Functionality
function initPopupFunctionality() {
  // Tab switching for popup
  const popupSearch = document.getElementById('transparent-flight-search-modal');
  if (!popupSearch) return;
  
  // Trip type radio buttons - return date always visible and enabled
  const returnDateField = document.getElementById('transparent-return-date-popup');
  const returnDateContainer = returnDateField ? returnDateField.closest('.transparent-search-field') : null;
  if (returnDateContainer) {
    returnDateContainer.style.display = 'flex';
  }
  
  const tabCols = popupSearch.querySelectorAll('.transparent-tab-col');
  const tabContents = popupSearch.querySelectorAll('.transparent-tab-content');
  
  tabCols.forEach(tabCol => {
    const tabLink = tabCol.querySelector('.transparent-tab-link');
    if (tabLink) {
      tabLink.addEventListener('click', function(e) {
        e.preventDefault();
        const targetTab = this.getAttribute('href');
        
        // Remove active class from all tabs and contents
        tabCols.forEach(col => col.classList.remove('active'));
        tabContents.forEach(content => {
          content.classList.remove('active');
          content.style.display = 'none';
        });
        
        // Add active class to clicked tab
        tabCol.classList.add('active');
        
        // Show corresponding content
        const targetContent = popupSearch.querySelector(targetTab);
        if (targetContent) {
          targetContent.classList.add('active');
          targetContent.style.display = 'block';
        }
      });
    }
  });
  
  // Calendar functionality for popup date fields
  const departDateInputPopup = document.getElementById('transparent-depart-date-popup');
  const returnDateInputPopup = document.getElementById('transparent-return-date-popup');
  const departureHiddenPopup = document.getElementById('departure-popup');
  const returnDateHiddenPopup = document.getElementById('return-date-popup');
  
  // Function to format date for display
  function formatDateForDisplay(ymd) {
    if (!ymd) return '';
    var parts = ymd.split('-');
    if (parts.length !== 3) return ymd;
    var date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
  }
  
  // Function to sync dates from hidden fields to visible popup fields
  function syncPopupDates() {
    if (departureHiddenPopup && departureHiddenPopup.value && departDateInputPopup) {
      var ymd = departureHiddenPopup.value;
      var formatted = formatDateForDisplay(ymd);
      departDateInputPopup.setAttribute('data-ymd', ymd);
      departDateInputPopup.setAttribute('value', formatted);
      departDateInputPopup.value = '';
      var label = departDateInputPopup.nextElementSibling;
      if (label && label.tagName === 'LABEL') {
        var labelSpan = label.querySelector('.label');
        if (labelSpan) labelSpan.textContent = formatted;
        label.style.opacity = '1';
        label.style.visibility = 'visible';
        label.style.display = 'flex';
      }
    } else if (departureHiddenPopup && !departureHiddenPopup.value && departDateInputPopup) {
      departDateInputPopup.value = '';
      departDateInputPopup.removeAttribute('data-ymd');
      departDateInputPopup.removeAttribute('value');
      var label = departDateInputPopup.nextElementSibling;
      if (label && label.tagName === 'LABEL') {
        var labelSpan = label.querySelector('.label');
        if (labelSpan) labelSpan.textContent = 'Depart Date';
        label.style.opacity = '1';
        label.style.visibility = 'visible';
        label.style.display = 'flex';
        label.style.color = '#1a202c';
        label.style.fontWeight = '700';
      }
    }
    
    if (returnDateHiddenPopup && returnDateHiddenPopup.value && returnDateInputPopup) {
      var ymd = returnDateHiddenPopup.value;
      var formatted = formatDateForDisplay(ymd);
      returnDateInputPopup.setAttribute('data-ymd', ymd);
      returnDateInputPopup.setAttribute('value', formatted);
      returnDateInputPopup.value = '';
      var label = returnDateInputPopup.nextElementSibling;
      if (label && label.tagName === 'LABEL') {
        var labelSpan = label.querySelector('.label');
        if (labelSpan) labelSpan.textContent = formatted;
        label.style.opacity = '1';
        label.style.visibility = 'visible';
        label.style.display = 'flex';
      }
    } else if (returnDateHiddenPopup && !returnDateHiddenPopup.value && returnDateInputPopup) {
      returnDateInputPopup.value = '';
      returnDateInputPopup.removeAttribute('data-ymd');
      returnDateInputPopup.removeAttribute('value');
      var label = returnDateInputPopup.nextElementSibling;
      if (label && label.tagName === 'LABEL') {
        var labelSpan = label.querySelector('.label');
        if (labelSpan) labelSpan.textContent = 'Return Date';
        label.style.opacity = '1';
        label.style.visibility = 'visible';
        label.style.display = 'flex';
        label.style.color = '#1a202c';
        label.style.fontWeight = '700';
      }
    }
  }
  
  // Function to open calendar for popup departure date (skipToReturn: when true, start at return-date step)
  function openPopupDepartCalendar(skipToReturn) {
    if (!departureHiddenPopup || typeof window.openRangeCalendar !== 'function') return;
    
    var tempDep = document.getElementById('departure');
    var tempRet = document.getElementById('return-date');
    
    if (!tempDep || !tempRet) return;
    
    tempDep.value = departureHiddenPopup.value || '';
    tempRet.value = returnDateHiddenPopup.value || '';
    
    var tripPopup = document.querySelector('input[name="trip-popup"]:checked');
    var tripOneway = document.getElementById('trip-oneway');
    var tripReturn = document.getElementById('trip-return');
    if (tripPopup && (tripOneway || tripReturn)) {
      var oneway = tripPopup.value === 'oneway';
      if (tripOneway) tripOneway.checked = oneway;
      if (tripReturn) tripReturn.checked = !oneway;
    }
    
    window.transparentPopupCalendarActive = true;
    window.openRangeCalendar(departDateInputPopup, !!skipToReturn);
    
    var syncFromCalendar = function() {
      if (tempDep && tempDep.value) departureHiddenPopup.value = tempDep.value;
      if (tempRet && tempRet.value) returnDateHiddenPopup.value = tempRet.value;
      syncPopupDates();
    };
    
    var checkClose = setInterval(function() {
      syncFromCalendar();
      var cal = document.getElementById('ek-calendar');
      if (!cal || cal.style.display === 'none' || !cal.classList.contains('open')) {
        clearInterval(checkClose);
        setTimeout(syncFromCalendar, 50);
        setTimeout(syncFromCalendar, 150);
        window.transparentPopupCalendarActive = false;
      }
    }, 100);
  }
  
  // Function to open calendar for popup return date
  function openPopupReturnCalendar() {
    if (!returnDateHiddenPopup || !departureHiddenPopup) return;
    
    // Check if departure date is selected first
    if (!departureHiddenPopup.value) {
      // Open departure calendar first
      openPopupDepartCalendar(false);
      return;
    }
    
    // Open calendar starting from return date selection (range mode step 1)
    openPopupDepartCalendar(true);
  }
  
  if (departDateInputPopup) {
    var departFieldPopup = departDateInputPopup.closest('.transparent-search-field');
    if (departFieldPopup) {
      departFieldPopup.style.cursor = 'pointer';
      departFieldPopup.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openPopupDepartCalendar();
      });
    }
  }
  
  if (returnDateInputPopup) {
    var returnFieldPopup = returnDateInputPopup.closest('.transparent-search-field');
    if (returnFieldPopup) {
      returnFieldPopup.style.cursor = 'pointer';
      returnFieldPopup.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openPopupReturnCalendar();
      });
    }
  }
  
  // Monitor hidden fields for changes and sync to visible fields
  if (departureHiddenPopup && returnDateHiddenPopup) {
    var syncObserver = new MutationObserver(function() {
      syncPopupDates();
    });
    
    syncObserver.observe(departureHiddenPopup, { attributes: true, attributeFilter: ['value'] });
    syncObserver.observe(returnDateHiddenPopup, { attributes: true, attributeFilter: ['value'] });
    
    // Also poll for value changes
    setInterval(function() {
      syncPopupDates();
    }, 200);
  }
  
  // Hook into calendar day click handler to sync popup dates
  // Listen for calendar day clicks and sync popup dates when in popup mode
  var popupCalendarClickHandler = function(e) {
    if (!window.transparentPopupCalendarActive) return;
    
    var day = e.target && e.target.closest ? e.target.closest('.ek-calendar-day') : null;
    if (day && !day.classList.contains('disabled') && !day.classList.contains('empty')) {
      var ymd = day.getAttribute('data-ymd');
      if (ymd) {
        // Sync dates after calendar system updates
        setTimeout(function() {
          var tempDep = document.getElementById('departure');
          var tempRet = document.getElementById('return-date');
          if (tempDep && tempDep.value) {
            departureHiddenPopup.value = tempDep.value;
          }
          if (tempRet && tempRet.value) {
            returnDateHiddenPopup.value = tempRet.value;
          }
          syncPopupDates();
        }, 50);
        setTimeout(function() {
          syncPopupDates();
        }, 150);
        setTimeout(function() {
          syncPopupDates();
        }, 300);
      }
    }
  };
  
  // Add event listener with capture phase to catch calendar clicks early
  document.addEventListener('click', popupCalendarClickHandler, true);
  
  // Passenger dropdown for popup
  const transparentPassengersInputPopup = document.getElementById('transparent-passengers-popup');
  const transparentPassengersDropdown = document.getElementById('transparent-passengers-dropdown');
  
  // Passenger counts for popup - default: 1 Adult
  var transparentPaxCountsPopup = {
    adults: 1,
    children: 0,
    infants: 0
  };
  
  // Ensure default value is set
  if (transparentPaxCountsPopup.adults === 0) {
    transparentPaxCountsPopup.adults = 1;
  }
  
  // Function to update popup passengers label
  function updatePopupPassengersLabel() {
    if (!transparentPassengersInputPopup) return;
    var label = transparentPassengersInputPopup.nextElementSibling;
    if (label && label.tagName === 'LABEL') {
      var labelSpan = label.querySelector('.label');
      if (labelSpan) {
        var text = '';
        if (transparentPaxCountsPopup.adults > 0) {
          text = transparentPaxCountsPopup.adults + (transparentPaxCountsPopup.adults === 1 ? ' Adult' : ' Adults');
        }
        if (transparentPaxCountsPopup.children > 0) {
          if (text) text += ', ';
          text += transparentPaxCountsPopup.children + (transparentPaxCountsPopup.children === 1 ? ' Child' : ' Children');
        }
        if (transparentPaxCountsPopup.infants > 0) {
          if (text) text += ', ';
          text += transparentPaxCountsPopup.infants + (transparentPaxCountsPopup.infants === 1 ? ' Infant' : ' Infants');
        }
        // Ensure default is "1 Adult" if no passengers selected
        if (!text) {
          text = '1 Adult';
          transparentPaxCountsPopup.adults = 1;
        }
        labelSpan.textContent = text;
        // Ensure label is visible
        label.style.opacity = '1';
        label.style.visibility = 'visible';
        label.style.display = 'flex';
      }
    }
  }
  
  // Function to update popup passengers display
  function updatePopupPassengersDisplay() {
    var adultVal = document.getElementById('pax-adult-val-popup');
    var childVal = document.getElementById('pax-child-val-popup');
    var infantVal = document.getElementById('pax-infant-val-popup');
    var adultMinus = document.getElementById('pax-adult-minus-popup');
    var childMinus = document.getElementById('pax-child-minus-popup');
    var infantMinus = document.getElementById('pax-infant-minus-popup');
    
    if (adultVal) adultVal.textContent = transparentPaxCountsPopup.adults;
    if (childVal) childVal.textContent = transparentPaxCountsPopup.children;
    if (infantVal) infantVal.textContent = transparentPaxCountsPopup.infants;
    
    if (adultMinus) adultMinus.disabled = transparentPaxCountsPopup.adults <= 1;
    if (childMinus) childMinus.disabled = transparentPaxCountsPopup.children <= 0;
    if (infantMinus) infantMinus.disabled = transparentPaxCountsPopup.infants <= 0;
    
    updatePopupPassengersLabel();
  }
  
  // Function to open popup passengers dropdown
  function openPopupPassengersDropdown() {
    if (!transparentPassengersDropdown || !transparentPassengersInputPopup) return;
    
    // Close calendar if open
    var cal = document.getElementById('ek-calendar');
    if (cal && cal.classList.contains('open')) {
      if (typeof window.hideCalendarModal === 'function') {
        window.hideCalendarModal();
      }
    }
    
    var rect = transparentPassengersInputPopup.getBoundingClientRect();
    transparentPassengersDropdown.style.top = (rect.bottom + 4) + 'px';
    transparentPassengersDropdown.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 296)) + 'px';
    transparentPassengersDropdown.classList.add('open');
    transparentPassengersDropdown.style.display = 'block';
  }
  
  // Function to close popup passengers dropdown
  function closePopupPassengersDropdown() {
    if (transparentPassengersDropdown) {
      transparentPassengersDropdown.classList.remove('open');
      transparentPassengersDropdown.style.display = 'none';
    }
  }
  
  if (transparentPassengersInputPopup && transparentPassengersDropdown) {
    // Ensure dropdown is in body
    if (transparentPassengersDropdown.parentElement !== document.body) {
      document.body.appendChild(transparentPassengersDropdown);
    }
    
    transparentPassengersInputPopup.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (transparentPassengersDropdown.classList.contains('open')) {
        closePopupPassengersDropdown();
      } else {
        openPopupPassengersDropdown();
      }
    });
    
    // Add event listeners for +/- buttons
    var adultPlus = document.getElementById('pax-adult-plus-popup');
    var adultMinus = document.getElementById('pax-adult-minus-popup');
    var childPlus = document.getElementById('pax-child-plus-popup');
    var childMinus = document.getElementById('pax-child-minus-popup');
    var infantPlus = document.getElementById('pax-infant-plus-popup');
    var infantMinus = document.getElementById('pax-infant-minus-popup');
    
    if (adultPlus) {
      adultPlus.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        transparentPaxCountsPopup.adults++;
        updatePopupPassengersDisplay();
      });
    }
    
    if (adultMinus) {
      adultMinus.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (transparentPaxCountsPopup.adults > 1) {
          transparentPaxCountsPopup.adults--;
          updatePopupPassengersDisplay();
        }
      });
    }
    
    if (childPlus) {
      childPlus.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        transparentPaxCountsPopup.children++;
        updatePopupPassengersDisplay();
      });
    }
    
    if (childMinus) {
      childMinus.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (transparentPaxCountsPopup.children > 0) {
          transparentPaxCountsPopup.children--;
          updatePopupPassengersDisplay();
        }
      });
    }
    
    if (infantPlus) {
      infantPlus.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        transparentPaxCountsPopup.infants++;
        updatePopupPassengersDisplay();
      });
    }
    
    if (infantMinus) {
      infantMinus.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (transparentPaxCountsPopup.infants > 0) {
          transparentPaxCountsPopup.infants--;
          updatePopupPassengersDisplay();
        }
      });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!transparentPassengersDropdown || !transparentPassengersInputPopup) return;
      if (transparentPassengersDropdown.classList.contains('open')) {
        if (!transparentPassengersDropdown.contains(e.target) && e.target !== transparentPassengersInputPopup && !transparentPassengersInputPopup.contains(e.target)) {
          closePopupPassengersDropdown();
        }
      }
    });
    
    // Initialize display
    updatePopupPassengersDisplay();
  }
  
  // Airport autocomplete for popup fields
  const fromInputPopup = document.getElementById('transparent-txtOriginFull-popup');
  const toInputPopup = document.getElementById('transparent-txtDestinationFull-popup');
  
  if (typeof setupAirportAutocomplete === 'function') {
    if (fromInputPopup) setupAirportAutocomplete(fromInputPopup, 'transparent-origin-popup', 'from');
    if (toInputPopup) setupAirportAutocomplete(toInputPopup, 'transparent-destination-popup', 'to');
  }
}

// Make function globally available
window.initPopupFunctionality = initPopupFunctionality;
