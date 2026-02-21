(function(){
      var header=document.querySelector('.main-header');
      var btn=document.getElementById('scroll-to-top');
      var navToggle=document.getElementById('nav-toggle');
      if(navToggle&&header){
        navToggle.addEventListener('click',function(){
          var open=header.classList.toggle('nav-open');
          navToggle.setAttribute('aria-expanded',open);
          navToggle.setAttribute('aria-label',open?'Close menu':'Open menu');
        });
        document.querySelectorAll('.nav-menu a').forEach(function(a){
          a.addEventListener('click',function(){header.classList.remove('nav-open');navToggle.setAttribute('aria-expanded','false');navToggle.setAttribute('aria-label','Open menu');});
        });
      }
      function onScroll(){
        var y = window.pageYOffset || (document.scrollingElement ? document.scrollingElement.scrollTop : 0) || document.documentElement.scrollTop || (document.body ? document.body.scrollTop : 0) || 0;
        if(header){if(y>60)header.classList.add('scrolled');else header.classList.remove('scrolled');}
        if(btn){
          if(y>10){
            btn.classList.add('visible');
            btn.style.setProperty('opacity','1','important');
            btn.style.setProperty('visibility','visible','important');
            btn.style.setProperty('pointer-events','auto','important');
          }else{
            btn.classList.remove('visible');
            btn.style.setProperty('opacity','0','important');
            btn.style.setProperty('visibility','hidden','important');
            btn.style.setProperty('pointer-events','none','important');
          }
        }
      }
      window.addEventListener('scroll',onScroll,{passive:true});
      document.addEventListener('scroll',onScroll,{passive:true});
      window.addEventListener('load',onScroll);
      if(btn)btn.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'});});
      onScroll();
      var sections=document.querySelectorAll('.section-animate');
      if(typeof IntersectionObserver!=='undefined'){
        var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting)e.target.classList.add('visible');});},{rootMargin:'0px 0px -50px 0px',threshold:0.08});
        sections.forEach(function(s){io.observe(s);});
      }else{sections.forEach(function(s){s.classList.add('visible');});}
    })();

(function(){
      // Fallback controller for home-page scroll-to-top button.
      var btn = document.getElementById('scroll-to-top');
      if(!btn) return;

      function getScrollY(){
        return window.pageYOffset ||
          (document.scrollingElement ? document.scrollingElement.scrollTop : 0) ||
          document.documentElement.scrollTop ||
          (document.body ? document.body.scrollTop : 0) || 0;
      }

      function syncVisibility(){
        var y = getScrollY();
        if(y > 10){
          btn.classList.add('visible');
          btn.style.setProperty('opacity','1','important');
          btn.style.setProperty('visibility','visible','important');
          btn.style.setProperty('pointer-events','auto','important');
        }else{
          btn.classList.remove('visible');
          btn.style.setProperty('opacity','0','important');
          btn.style.setProperty('visibility','hidden','important');
          btn.style.setProperty('pointer-events','none','important');
        }
      }

      window.addEventListener('scroll', syncVisibility, { passive: true });
      document.addEventListener('scroll', syncVisibility, { passive: true });
      window.addEventListener('load', syncVisibility);
      window.addEventListener('pageshow', syncVisibility);
      setInterval(syncVisibility, 300);
      syncVisibility();
    })();