/* Learnberry oynatıcı */
function KKPlayerRuntime(global) {
  'use strict';

  /*
   * Giriş / çıkış efektleri (0.14: çıkış). Öğede: effect / effectDur (giriş), exit / exitDur (çıkış); süre boşsa
   * varsayılan. Giriş, öğenin başlangıcında başlar; çıkış, öğenin bitişinde BİTER (bitiş - süre anında başlar).
   * Bitişi "slayt sonu" olan öğe çıkış efektiyle slayt (katman) süresinin sonunda çıkar ve gizli kalır.
   * Hem oynatıcı hem editördeki sahnede oynatma fxPhase / fxAnimation kullanır (tek kaynak).
   */
  var FX_IN = {
    fade: { name: 'kkp-fade', dur: 0.6, ease: 'ease-out' },
    left: { name: 'kkp-left', dur: 0.6, ease: 'cubic-bezier(.2,.7,.3,1)' },
    up: { name: 'kkp-up', dur: 0.6, ease: 'cubic-bezier(.2,.7,.3,1)' },
    zoom: { name: 'kkp-zoom', dur: 0.5, ease: 'cubic-bezier(.2,.7,.3,1)' }
  };
  var FX_OUT = {
    fade: { name: 'kkp-out-fade', dur: 0.6, ease: 'ease-in' },
    left: { name: 'kkp-out-left', dur: 0.6, ease: 'cubic-bezier(.7,0,.8,.3)' },
    down: { name: 'kkp-out-down', dur: 0.6, ease: 'cubic-bezier(.7,0,.8,.3)' },
    zoom: { name: 'kkp-out-zoom', dur: 0.5, ease: 'cubic-bezier(.7,0,.8,.3)' }
  };
  var FX_MIN = 0.1, FX_MAX = 10;

  /** Efektin süresi (sn): öğede geçerli bir süre varsa o, yoksa efektin varsayılanı */
  function fxDur(e, kind) {
    var def = kind === 'out' ? FX_OUT[e.exit] : FX_IN[e.effect];
    if (!def) return 0;
    var d = kind === 'out' ? e.exitDur : e.effectDur;
    return typeof d === 'number' && d >= FX_MIN && d <= FX_MAX ? d : def.dur;
  }
  function hasExit(e) { return !!FX_OUT[e.exit]; }
  /** Öğenin etkin bitişi: end; "slayt sonu" ise çıkış efekti varsa süre, yoksa sonsuz (görünür kalır) */
  function itemEnd(e, dur) {
    if (e.end != null) return +e.end;
    return hasExit(e) ? dur : Infinity;
  }
  /** t anında oynayan efekt: { kind: 'in'|'out', since, def, dur } ya da null. Çıkış girişten önceliklidir. */
  function fxPhase(e, t, dur) {
    var st = +e.start || 0, en = itemEnd(e, dur);
    if (t < st || t >= en) return null;
    if (hasExit(e) && en !== Infinity) {
      var d = fxDur(e, 'out'), s0 = Math.max(st, en - d);
      if (t >= s0) return { kind: 'out', since: t - (en - d), def: FX_OUT[e.exit], dur: d };
    }
    if (FX_IN[e.effect]) {
      var di = fxDur(e, 'in');
      if (t - st < di) return { kind: 'in', since: t - st, def: FX_IN[e.effect], dur: di };
    }
    return null;
  }
  /** Efektin CSS animasyonu; since anından başlar (negatif gecikme), rate: oynatma hızı */
  function fxAnimation(ph, rate) {
    rate = rate || 1;
    return ph.def.name + ' ' + (ph.dur / rate).toFixed(3) + 's ' + ph.def.ease + ' ' + (-ph.since / rate).toFixed(3) + 's both';
  }

  var CSS = [
    /* tema: renkler değişkenlerde; açık tema .kkp-light, vurgu rengi --kkp-accent (oynatıcı ayarları) */
    '.kkp{--kkp-bg:#14161c;--kkp-bar:#1c1f27;--kkp-line:#2a2f3a;--kkp-btn:#262b36;--kkp-btn-hover:#2f3542;--kkp-btn-line:#3a4150;--kkp-fg:#e9ecf2;--kkp-soft:#c4cad6;--kkp-muted:#9aa4b8;--kkp-track:#4a5163;--kkp-overlay:rgba(14,16,22,.92);--kkp-menu:#17191f;--kkp-accent:#cd1e47;--kkp-on-accent:#fff}',
    '.kkp.kkp-light{--kkp-bg:#e3e7ee;--kkp-bar:#fff;--kkp-line:#d5dae3;--kkp-btn:#f3f5f8;--kkp-btn-hover:#e7eaf0;--kkp-btn-line:#c9cfda;--kkp-fg:#1f2430;--kkp-soft:#3a4150;--kkp-muted:#5f6878;--kkp-track:#c5cbd6;--kkp-overlay:rgba(227,231,238,.95);--kkp-menu:#fff}',
    '.kkp{position:absolute;inset:0;display:flex;flex-direction:column;background:var(--kkp-bg);font-family:"Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;color:var(--kkp-fg);user-select:none}',
    '.kkp-viewport{position:relative;flex:1;overflow:hidden}',
    '.kkp-stage{position:absolute;left:0;top:0;transform-origin:0 0;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.45)}',
    '.kkp-el{position:absolute;box-sizing:border-box}',
    '.kkp-x{position:absolute;box-sizing:border-box;z-index:1;pointer-events:auto}',
    '.kkp-text{width:100%;height:100%;white-space:pre-wrap;word-break:break-word;line-height:1.25;padding:4px 6px;box-sizing:border-box;overflow:hidden}',
    '.kkp-img,.kkp-video{width:100%;height:100%;object-fit:contain;display:block}',
    '.kkp-video{background:#000}',
    '.kkp-tap{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:5;display:flex;align-items:center;gap:10px;height:56px;padding:0 24px 0 18px;border:none;border-radius:999px;background:rgba(0,0,0,.72);color:#fff;font:inherit;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35)}',
    '.kkp-tap svg{width:28px;height:28px}',
    '.kkp-tap:hover{background:rgba(0,0,0,.85)}',
    '.kkp-media-msg{position:absolute;left:12px;right:12px;top:50%;transform:translateY(-50%);z-index:5;padding:14px 16px;border-radius:10px;background:rgba(0,0,0,.78);color:#fff;font-size:15px;line-height:1.4;text-align:center}',
    '.kkp-audio{width:100%;height:100%;border-radius:50%;border:none;background:#3b5bdb;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);padding:0}',
    '.kkp-audio svg{width:46%;height:46%}',
    '.kkp-audio.is-playing{background:#2f9e44}',
    '.kkp-vthumb{width:100%;height:100%;background:#1f2430;display:flex;align-items:center;justify-content:center;color:#9aa4b8}',
    '.kkp-vthumb svg{width:30%;height:30%;max-width:60px;max-height:60px}',
    '.kkp-btn{height:36px;min-width:36px;padding:0 14px;border-radius:8px;border:1px solid var(--kkp-btn-line);background:var(--kkp-btn);color:var(--kkp-fg);font:inherit;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}',
    '.kkp-btn:hover:not(:disabled){background:var(--kkp-btn-hover)}',
    '.kkp-btn:focus{outline:none}',
    '.kkp-btn:focus-visible{outline:2px solid var(--kkp-accent);outline-offset:2px}',
    '.kkp-btn:disabled{opacity:.4;cursor:default}',
    '.kkp-btn.primary{background:var(--kkp-accent);border-color:var(--kkp-accent);color:var(--kkp-on-accent)}',
    '.kkp-btn.primary:hover:not(:disabled){background:var(--kkp-accent);filter:brightness(.9)}',
    '.kkp-title{flex:1;min-width:0;font-size:14px;font-weight:600;color:var(--kkp-fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.kkp-progress{width:180px;height:6px;border-radius:3px;background:var(--kkp-btn-hover);overflow:hidden}',
    /* 0.17: yan yana, hap biçimli Önceki / Sonraki; yüzen menü düğmesi; menüde sayaç ve ilerleme */
    '.kkp-nav{display:flex;align-items:center;gap:8px;flex:0 0 auto}',
    '.kkp-nav .kkp-btn{height:40px;border-radius:999px;font-weight:600;gap:4px;transition:transform .12s,box-shadow .12s,background .12s,filter .12s}',
    '.kkp-nav .kkp-prev{padding:0 18px 0 12px;background:transparent}',
    '.kkp-nav .kkp-next{padding:0 12px 0 20px;box-shadow:0 6px 16px rgba(0,0,0,.28)}',
    '.kkp-nav .kkp-btn:hover:not(:disabled){transform:translateY(-1px)}',
    '.kkp-nav .kkp-btn:active:not(:disabled){transform:none}',
    '.kkp-nav .kkp-btn:disabled{box-shadow:none}',
    /* denetim çubuğunda Önceki / Sonraki (0.18) */
    '.kkp-seek .kkp-nav{margin:0 4px 0 6px}',
    '.kkp-seek .kkp-nav .kkp-btn{height:34px;font-size:13px}',
    '.kkp-seek .kkp-nav .kkp-prev{padding:0 14px 0 8px}',
    '.kkp-seek .kkp-nav .kkp-next{padding:0 8px 0 16px}',
    '.kkp-over .kkp-nav .kkp-prev{border-color:rgba(255,255,255,.4);background:rgba(255,255,255,.08);color:#fff}',
    '.kkp-over .kkp-nav .kkp-prev:hover:not(:disabled){background:rgba(255,255,255,.18)}',
    '.kkp-over .kkp-nav .kkp-btn:disabled{opacity:.45}',
    '.kkp-seek .kkp-count{min-width:44px;font-size:12px;color:inherit;opacity:.85}',
    '.kkp-seek .kkp-progress{width:90px;flex:0 0 90px}',
    /* 0.18: sol üstte yüzen menü düğmesi + slayt başlığı */
    '.kkp-top{position:absolute;left:14px;top:14px;right:14px;z-index:35;display:flex;align-items:center;gap:8px;pointer-events:none;transition:opacity .3s}',
    '.kkp-top>*{pointer-events:auto}',
    '.kkp-idle .kkp-top{opacity:0}',
    '.kkp-float{height:40px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(18,20,26,.74);color:#fff;box-shadow:0 6px 18px rgba(0,0,0,.25);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
    '.kkp-light .kkp-float{background:rgba(255,255,255,.9);border-color:var(--kkp-line);color:var(--kkp-fg)}',
    '.kkp-menu-btn.kkp-float{padding:0 16px 0 12px;font-weight:600;transition:background .15s}',
    '.kkp-menu-btn.kkp-float:hover:not(:disabled){background:rgba(18,20,26,.9)}',
    '.kkp-light .kkp-menu-btn.kkp-float:hover:not(:disabled){background:#fff}',
    '.kkp-title.kkp-float{flex:0 1 auto;display:block;max-width:min(520px,60%);padding:0 16px;line-height:38px;font-size:14px;font-weight:600}',
    '.kkp-title.kkp-float:empty{display:none}',
    '.kkp-menu-stats{display:flex;align-items:center;gap:12px;padding:2px 20px 16px;border-bottom:1px solid var(--kkp-line)}',
    '.kkp-menu-stats .kkp-count{min-width:0;text-align:left;font-size:12px;font-weight:600;color:var(--kkp-soft)}',
    '.kkp-menu-stats .kkp-progress{flex:1;width:auto}',
    '.kkp-has-stats .kkp-menu-top{border-bottom:none;padding-bottom:8px}',
    '.kkp-top~.kkp-menu{top:64px}', /* menü düğmesi açıkken de görünsün (tekrar tıklayınca kapanır) */
    '.kkp-menu-btn.kkp-float[aria-expanded=true]{background:var(--kkp-accent);border-color:var(--kkp-accent);color:var(--kkp-on-accent)}',
    '.kkp-progress>i{display:block;height:100%;background:var(--kkp-accent);transition:width .25s}',
    '.kkp-count{font-size:13px;color:var(--kkp-muted);min-width:56px;text-align:center;font-variant-numeric:tabular-nums}',
    /* başlangıç ekranı (0.26): arkada bulanık ilk slayt, vurgu renginden ışık, büyük başlık, hap biçimli düğmeler */
    '.kkp-start{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;z-index:50;text-align:center;padding:32px;background:rgba(14,16,22,.8);-webkit-backdrop-filter:blur(14px) saturate(1.1);backdrop-filter:blur(14px) saturate(1.1)}',
    '.kkp-start::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(60% 55% at 50% 38%,var(--kkp-accent),transparent 70%);opacity:.22}',
    '.kkp.kkp-light .kkp-start::before{opacity:.14}',
    '.kkp.kkp-light .kkp-start{background:rgba(232,236,243,.78)}',
    '.kkp-start>*{position:relative;animation:kkp-start-in .55s cubic-bezier(.2,.7,.2,1) both}',
    '.kkp-start>*:nth-child(2){animation-delay:.08s}',
    '.kkp-start>*:nth-child(3){animation-delay:.16s}',
    '@keyframes kkp-start-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}',
    '.kkp-start h1{margin:0;max-width:880px;font-size:clamp(26px,4.2vw,48px);line-height:1.15;font-weight:700;letter-spacing:-.02em;color:var(--kkp-fg);text-wrap:balance}',
    '.kkp-start p{margin:-12px 0 0;color:var(--kkp-soft);font-size:clamp(15px,1.6vw,18px)}',
    '.kkp-exit{z-index:60;gap:22px}',
    '.kkp-start-btns{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;align-items:center}',
    '.kkp-start .kkp-btn{height:58px;padding:0 34px 0 10px;border-radius:999px;font-size:18px;font-weight:600;letter-spacing:.01em;gap:14px;border:0;transition:transform .18s ease,box-shadow .18s ease,background .18s ease}',
    '.kkp-start .kkp-start-go{position:relative;background:var(--kkp-accent);color:var(--kkp-on-accent);box-shadow:0 10px 30px -8px var(--kkp-accent),0 2px 6px rgba(0,0,0,.25)}',
    '.kkp-start .kkp-start-go:hover:not(:disabled){background:var(--kkp-accent);transform:translateY(-2px);box-shadow:0 16px 38px -8px var(--kkp-accent),0 3px 8px rgba(0,0,0,.25)}',
    '.kkp-start .kkp-start-go:active{transform:translateY(0) scale(.98)}',
    '.kkp-start .kkp-start-go::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:0 0 0 0 var(--kkp-accent);animation:kkp-start-pulse 2.4s ease-out 1s infinite;pointer-events:none}',
    '@keyframes kkp-start-pulse{0%{box-shadow:0 0 0 0 var(--kkp-accent);opacity:.55}70%,100%{box-shadow:0 0 0 18px var(--kkp-accent);opacity:0}}',
    '.kkp-start-ico{width:40px;height:40px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:rgba(255,255,255,.2);flex:0 0 auto}',
    '.kkp-start-ico svg{width:20px;height:20px;margin-left:2px}',
    '.kkp-start .kkp-start-over{height:52px;padding:0 26px;background:transparent;color:var(--kkp-fg);box-shadow:inset 0 0 0 1.5px var(--kkp-btn-line)}',
    '.kkp-start .kkp-start-over:hover:not(:disabled){background:var(--kkp-btn);transform:translateY(-1px)}',
    '.kkp-start .kkp-btn:focus-visible{outline:3px solid var(--kkp-fg);outline-offset:4px}',
    '@media (prefers-reduced-motion:reduce){.kkp-start>*,.kkp-start .kkp-start-go::after{animation:none}.kkp-start .kkp-btn{transition:none}}',
    /* menü (slayt listesi) */
    '.kkp-btn svg{flex:0 0 auto}',
    '.kkp-close{position:absolute;top:12px;right:12px;z-index:60}',
    '@keyframes kkp-out-fade{from{opacity:1}to{opacity:0}}',
    '@keyframes kkp-out-left{from{opacity:1;transform:none}to{opacity:0;transform:translateX(-60px)}}',
    '@keyframes kkp-out-down{from{opacity:1;transform:none}to{opacity:0;transform:translateY(50px)}}',
    '@keyframes kkp-out-zoom{from{opacity:1;transform:none}to{opacity:0;transform:scale(.8)}}',
    '@keyframes kkp-fade{from{opacity:0}to{opacity:1}}',
    '@keyframes kkp-left{from{opacity:0;transform:translateX(-60px)}to{opacity:1;transform:none}}',
    '@keyframes kkp-up{from{opacity:0;transform:translateY(50px)}to{opacity:1;transform:none}}',
    '@keyframes kkp-zoom{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}}',
    '.kkp-replay{padding:0;width:36px;justify-content:center}',
    /* denetim çubuğu (0.16, video oynatıcı gibi): slaydın üstünde (.kkp-over, boştayken gizlenir) ya da altında */
    '.kkp-seek{display:flex;align-items:center;gap:4px;padding:6px 12px;background:var(--kkp-bar);border-top:1px solid var(--kkp-line);color:var(--kkp-soft)}',
    '.kkp-seek.kkp-over{position:absolute;left:0;right:0;bottom:0;z-index:30;padding:40px 14px 10px;background:linear-gradient(rgba(0,0,0,0),rgba(0,0,0,.72));border:none;color:#fff;transition:opacity .3s}',
    '.kkp-idle .kkp-seek.kkp-over{opacity:0}',
    '.kkp-idle .kkp-viewport{cursor:none}',
    /* altyazılar (0.22): slaydın alt ortasında; üstte yüzen denetim çubuğu görünürken onun üstüne çıkar */
    '.kkp-cc{position:absolute;left:50%;bottom:5%;transform:translateX(-50%);width:max-content;max-width:86%;z-index:28;pointer-events:none;text-align:center;transition:bottom .3s}',
    '.kkp-cc[hidden]{display:none}',
    '.kkp-cc-lift{bottom:78px}',
    '.kkp-idle .kkp-cc-lift{bottom:5%}',
    '.kkp-cc-text{display:inline;background:rgba(18,20,26,.84);color:#fff;font:500 clamp(14px,2.2vw,24px)/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;padding:.2em .65em;border-radius:6px;white-space:pre-line;-webkit-box-decoration-break:clone;box-decoration-break:clone}',
    '.kkp-cc-btn[aria-pressed="true"]{color:var(--kkp-accent)}',
    '.kkp-over .kkp-cc-btn[aria-pressed="true"]{color:#fff;box-shadow:inset 0 -2px 0 #fff}',
    '.kkp-ctl{width:36px;height:36px;flex:0 0 36px;border:none;border-radius:8px;background:transparent;color:inherit;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;position:relative}',
    '.kkp-ctl:hover{background:rgba(128,128,128,.22)}',
    '.kkp-ctl:focus{outline:none}',
    '.kkp-ctl:focus-visible{outline:2px solid var(--kkp-accent);outline-offset:1px}',
    '.kkp-ctl svg{width:20px;height:20px;display:block}',
    '.kkp-seek-btn svg{width:24px;height:24px}',
    '.kkp-skip-back svg,.kkp-skip-fwd svg{width:25px;height:25px}',
    '.kkp-seek-track{position:relative;flex:1;min-width:60px;height:22px;margin:0 8px;cursor:pointer;touch-action:none}',
    '.kkp-seek-track:before{content:"";position:absolute;left:0;right:0;top:9px;height:4px;border-radius:2px;background:var(--kkp-track)}',
    '.kkp-over .kkp-seek-track:before{background:rgba(255,255,255,.32)}',
    '.kkp-seek-fill{position:absolute;left:0;top:9px;height:4px;width:0;border-radius:2px;background:var(--kkp-accent)}',
    '.kkp-over .kkp-seek-fill{background:#fff}',
    '.kkp-seek-knob{position:absolute;left:0;top:4px;width:14px;height:14px;margin-left:-7px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.45);transform:scale(.85);transition:transform .15s}',
    '.kkp-seek-track:hover .kkp-seek-knob,.kkp-seek-track:focus .kkp-seek-knob,.kkp-seek-track.kkp-drag .kkp-seek-knob{transform:scale(1.15)}',
    '.kkp-seek-track:focus{outline:none}',
    '.kkp-seek-track:focus-visible:before{box-shadow:0 0 0 2px var(--kkp-accent)}',
    '.kkp-seek-time,.kkp-seek-remain{flex:0 0 auto;min-width:42px;padding:0 4px;font-size:13px;font-variant-numeric:tabular-nums;opacity:.92}',
    '.kkp-seek-remain{text-align:right}',
    '.kkp-seek-spacer{flex:1}',
    '.kkp-speed-val{position:absolute;right:-3px;top:-1px;padding:0 3px;border-radius:6px;background:var(--kkp-accent);color:var(--kkp-on-accent);font-size:9px;font-weight:700;line-height:14px;font-variant-numeric:tabular-nums}',
    '.kkp-speed-val:empty{display:none}',
    '.kkp-speed-menu{color:var(--kkp-fg)}',
    /* menü (0.16): kart görünümü, açılır-kapanır bölümler, slayt süresi, tamamlandı işareti */
    '.kkp-menu{position:absolute;left:12px;top:12px;bottom:12px;width:340px;max-width:calc(100% - 24px);z-index:40;display:flex;flex-direction:column;background:var(--kkp-menu);color:var(--kkp-fg);border:1px solid var(--kkp-line);border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.45);overflow:hidden}',
    '.kkp-menu[hidden]{display:none}',
    '.kkp-menu-top{display:flex;align-items:center;gap:8px;padding:14px 10px 12px 20px;border-bottom:1px solid var(--kkp-line)}',
    '.kkp-menu-head{flex:1;min-width:0;font-size:15px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.kkp-menu-close{width:32px;height:32px;flex-basis:32px;color:var(--kkp-muted)}',
    '.kkp-menu-list{flex:1;overflow-y:auto}',
    '.kkp-sec+.kkp-sec{border-top:1px solid var(--kkp-line)}',
    '.kkp-sec-head{width:100%;display:flex;align-items:center;gap:12px;padding:16px 18px 16px 20px;border:none;background:transparent;color:var(--kkp-fg);font:inherit;text-align:left;cursor:pointer}',
    '.kkp-sec-head:hover{background:var(--kkp-btn)}',
    '.kkp-sec-head:focus{outline:none}',
    '.kkp-sec-head:focus-visible{outline:2px solid var(--kkp-accent);outline-offset:-2px}',
    '.kkp-sec-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}',
    '.kkp-sec-no{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--kkp-muted)}',
    '.kkp-sec-title{font-size:14px;font-weight:600;line-height:1.35}',
    '.kkp-sec-toggle{flex:0 0 auto;display:flex;color:var(--kkp-soft)}',
    '.kkp-sec-toggle svg{width:18px;height:18px}',
    '.kkp-sec-items{padding:0 10px 10px}',
    '.kkp-sec-items[hidden]{display:none}',
    '.kkp-menu-flat{padding:8px 10px}',
    '.kkp-sec+.kkp-menu-flat,.kkp-menu-flat+.kkp-sec{border-top:1px solid var(--kkp-line)}',
    '.kkp-sub-row{display:flex;align-items:center;gap:2px}',
    '.kkp-sub-row .kkp-menu-item{flex:1;min-width:0}',
    '.kkp-sub-toggle{flex:0 0 auto;width:32px;height:32px;margin-right:4px;padding:0;display:flex;align-items:center;justify-content:center;border:none;border-radius:8px;background:transparent;color:var(--kkp-soft);cursor:pointer}',
    '.kkp-sub-toggle:hover{background:var(--kkp-btn)}',
    '.kkp-sub-toggle:focus{outline:none}',
    '.kkp-sub-toggle:focus-visible,.kkp-sub-head:focus-visible{outline:2px solid var(--kkp-accent);outline-offset:-2px}',
    '.kkp-sub-toggle svg{width:16px;height:16px}',
    '.kkp-sub-head{flex:1;min-width:0;margin:2px 0;padding:12px 14px;border:none;border-radius:10px;background:transparent;color:var(--kkp-fg);font:inherit;font-size:14px;font-weight:600;text-align:left;cursor:pointer}',
    '.kkp-sub-head:hover{background:var(--kkp-btn)}',
    '.kkp-sub-head:focus{outline:none}',
    '.kkp-sub-items{margin-left:14px;padding-left:8px;border-left:1px solid var(--kkp-line)}',
    '.kkp-sub-items[hidden]{display:none}',
    '.kkp-menu-heading{padding:12px 14px 6px;font-size:12px;font-weight:600;letter-spacing:.04em;color:var(--kkp-muted)}',
    '.kkp-menu-item{width:100%;display:flex;align-items:center;gap:12px;margin:2px 0;padding:12px 14px;border:none;border-radius:10px;background:transparent;color:var(--kkp-soft);font:inherit;text-align:left;cursor:pointer}',
    '.kkp-menu-item:hover:not(:disabled){background:var(--kkp-btn)}',
    '.kkp-menu-item:disabled{opacity:.45;cursor:default}',
    '.kkp-menu-item:focus{outline:none}',
    '.kkp-menu-item:focus-visible{outline:2px solid var(--kkp-accent);outline-offset:-2px}',
    '.kkp-menu-item[aria-current]{background:var(--kkp-btn-hover);color:var(--kkp-fg)}',
    '.kkp-mi-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}',
    '.kkp-menu-name{font-size:14px;font-weight:500;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.kkp-menu-item[aria-current] .kkp-menu-name{font-weight:600}',
    '.kkp-menu-dur{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--kkp-muted);font-variant-numeric:tabular-nums}',
    '.kkp-menu-dur svg{width:14px;height:14px}',
    '.kkp-menu-seen,.kkp-sec-done{display:inline-flex;color:#37b24d}',
    '.kkp-menu-seen svg{width:20px;height:20px}',
    '.kkp-sec-done svg{width:14px;height:14px}',
    '.kkp-menu-lock{display:inline-flex;color:var(--kkp-muted)}',
    '.kkp-menu-lock svg{width:15px;height:15px}',
    '.kkp-menu-btn[aria-expanded=true]{border-color:var(--kkp-accent)}',
    /* oynatma hızı (0.13) */
    '.kkp-speed{position:relative;flex:0 0 auto}',
    '.kkp-speed-menu{position:absolute;right:0;bottom:calc(100% + 6px);min-width:160px;margin:0;padding:6px 0;list-style:none;background:var(--kkp-bar);border:1px solid var(--kkp-line);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.3);z-index:45}',
    '.kkp-speed-menu[hidden]{display:none}',
    '.kkp-speed-head{padding:4px 14px 6px;font-size:12px;color:var(--kkp-muted)}',
    '.kkp-speed-item{width:100%;white-space:nowrap;display:flex;align-items:center;gap:8px;padding:7px 14px;border:none;background:transparent;color:var(--kkp-soft);font:inherit;font-size:14px;text-align:left;cursor:pointer}',
    '.kkp-speed-item:hover,.kkp-speed-item:focus{background:var(--kkp-btn);color:var(--kkp-fg);outline:none}',
    '.kkp-speed-item:before{content:"";width:14px;flex:0 0 14px;text-align:center;color:var(--kkp-accent);font-weight:700}',
    '.kkp-speed-item[aria-checked=true]{color:var(--kkp-fg);font-weight:600}',
    '.kkp-speed-item[aria-checked=true]:before{content:"\\2713"}',
    '.kkp-layer{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}',
    '.kkp-layer>.kkp-el{pointer-events:auto}',
    '.kkp-layer.kkp-modal{pointer-events:auto}',
    '.kkp-base-hidden>.kkp-el{display:none}',
    '.kkp-shape{position:relative;width:100%;height:100%}',
    '.kkp-shape svg{position:absolute;left:0;top:0;overflow:visible;display:block}',
    '.kkp-shape.kkp-shadow svg{filter:drop-shadow(0 4px 8px rgba(0,0,0,.3))}',
    '.kkp-shape-label{position:absolute;display:flex;box-sizing:border-box;padding:6px 10px}',
    '.kkp-shape-label>.kkp-text{height:auto;min-height:1.25em;max-height:100%;width:100%;padding:0}',
    /* şekiller: tıklama yalnızca şeklin kendisinde (sınır kutusunun boş köşelerinde değil) */
    '.kkp-el-shape,.kkp-layer>.kkp-el.kkp-el-shape{pointer-events:none}',
    '.kkp-el-shape svg>*{pointer-events:visible}',
    '.kkp-el-shape .kkp-shape-label>.kkp-text{pointer-events:auto}',
    '.kkp-click{cursor:pointer}',
    /* hotspot (0.30): görünmez; tıklama yalnızca alanın kendisinde (oval / serbest biçimin dışındaki köşelerde değil) */
    '.kkp-hotspot{position:relative;width:100%;height:100%}',
    '.kkp-hotspot svg{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;display:block}',
    '.kkp-el-hs,.kkp-layer>.kkp-el.kkp-el-hs{pointer-events:none}',
    '.kkp-el-hs .kkp-hotspot:not(.kkp-hotspot-ed) svg>*{pointer-events:visible}',
    /* sorular (0.24): seçenekler ve uyarı */
    '.kkp-choice{cursor:pointer}',
    '.kkp-choice:focus{outline:none}',
    '.kkp-choice:focus-visible{outline:3px solid #4c6ef5;outline-offset:2px}',
    '.kkp-choice-auto.kkp-choice-sel{outline:3px solid var(--kkp-accent,#4c6ef5);outline-offset:3px;border-radius:6px}',
    '.kkp-choice-locked{cursor:default}',
    '.kkp-quiz-msg{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:3000;background:rgba(18,20,26,.9);color:#fff;font:500 18px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;padding:14px 22px;border-radius:10px;pointer-events:none;box-shadow:0 8px 30px rgba(0,0,0,.3);text-align:center;max-width:70%}',
    '.kkp-quiz-msg[hidden]{display:none}',
    /* metin giriş kutusu ve sıcak nokta (0.25) */
    '.kkp-input{display:block;width:100%;height:100%;box-sizing:border-box;margin:0;padding:0 .6em;border-style:solid;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;outline:none;-webkit-appearance:none;appearance:none}',
    '.kkp-input:focus{box-shadow:0 0 0 3px rgba(76,110,245,.35)}',
    '.kkp-input[readonly]{cursor:default;opacity:.85}',
    '.kkp-input-ph{display:flex;align-items:center;color:#868e96;overflow:hidden;white-space:nowrap}',
    '.kkp-hs-spot{opacity:0!important}',
    '.kkp-hs-spot,.kkp-hs-spot *{pointer-events:none!important}', /* şeklin SVG'si de tıklamayı alana bıraksın */
    '.kkp-hs-area{cursor:crosshair}',
    '.kkp-hs-area.kkp-choice-locked{cursor:default}',
    '.kkp-hs-marker{position:absolute;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:3px solid #fff;background:var(--kkp-accent,#4c6ef5);box-shadow:0 0 0 2px var(--kkp-accent,#4c6ef5),0 4px 12px rgba(0,0,0,.35);pointer-events:none;z-index:900}',
    '.kkp-hs-marker::after{content:"";position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:#fff}',
    '.kkp-click:focus{outline:none}',
    '.kkp-click:focus-visible{outline:3px solid #4c6ef5;outline-offset:2px}',
    '@media (prefers-reduced-motion:reduce){.kkp-el{animation:none !important}}',
    /* 0.39: mikro-öğrenme kartları — telefonda dikey kart: üstte canlı slayt (viewport karta taşınır), altta kart metni */
    '.kkp-cards-btn.kkp-float{padding:0 16px 0 12px;font-weight:600;gap:8px}',
    '.kkp-cards-btn svg,.kkp-start .kkp-start-cards svg{width:18px;height:18px}',
    '.kkp-start .kkp-start-cards{display:inline-flex;align-items:center;gap:8px}',
    '.kkp-cards{position:absolute;inset:0;z-index:65;background:var(--kkp-bg);display:flex;justify-content:center}',
    '.kkp-cards[hidden]{display:none}',
    '.kkp-cards-in{position:relative;width:100%;max-width:480px;height:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:10px;padding:10px 12px 12px;padding-bottom:max(12px,env(safe-area-inset-bottom))}',
    '.kkp-cards-bars{display:flex;gap:4px;flex:0 0 auto}',
    '.kkp-cards-bar{flex:1;height:3px;border-radius:2px;background:var(--kkp-line);overflow:hidden}',
    '.kkp-cards-bar i{display:block;height:100%;width:0;background:var(--kkp-fg)}',
    '.kkp-cards-head{display:flex;align-items:center;gap:10px;flex:0 0 auto;min-height:36px}',
    '.kkp-cards-count{flex:0 0 auto;font-size:12px;font-weight:700;color:var(--kkp-muted);font-variant-numeric:tabular-nums}',
    '.kkp-cards-name{flex:1;min-width:0;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.kkp-cards-close{gap:6px;padding:0 12px 0 8px;flex:0 0 auto}',
    '.kkp-cards-close svg{width:16px;height:16px}',
    '.kkp-card{flex:0 1 auto;margin:auto 0;min-height:0;display:flex;flex-direction:column;border-radius:18px;overflow:hidden;background:var(--kkp-bar);border:1px solid var(--kkp-line);touch-action:pan-y;box-shadow:0 18px 50px -24px rgba(0,0,0,.6)}',
    '.kkp-card-stage{position:relative;flex:0 0 auto;width:100%;aspect-ratio:16/9;background:#000}',
    '.kkp-card-stage .kkp-viewport{position:absolute;inset:0;flex:none}',
    '.kkp-cards-open .kkp-card-stage .kkp-top,.kkp-cards-open .kkp-card-stage .kkp-seek,.kkp-cards-open .kkp-card-stage .kkp-cc,.kkp-cards-open .kkp-card-stage .kkp-menu{display:none}',
    '.kkp-card-text{flex:0 1 auto;min-height:0;overflow:auto;padding:16px 18px 18px;font-size:17px;line-height:1.5;white-space:pre-line;color:var(--kkp-fg);-webkit-overflow-scrolling:touch}',
    '.kkp-card-notext .kkp-card-text{display:none}',
    '.kkp-cards-ctl{flex:0 0 auto;display:flex;align-items:center;gap:8px}',
    '.kkp-cards-ctl .kkp-ctl{width:44px;height:44px;flex:0 0 44px}',
    '.kkp-cards-ctl .kkp-ctl svg{width:22px;height:22px}',
    '.kkp-cards-ctl .kkp-cards-next{margin-left:auto;height:44px;padding:0 18px 0 20px;font-size:15px;font-weight:600;border-radius:22px}',
    '.kkp-cards-ctl .kkp-cards-prev{height:44px;width:44px;min-width:0;padding:0;justify-content:center;border-radius:22px}',
    '.kkp-cards-next.kkp-card-ready:not(:disabled){animation:kkp-card-pulse 1.6s ease-out infinite}',
    '@keyframes kkp-card-pulse{0%{box-shadow:0 0 0 0 var(--kkp-accent)}70%{box-shadow:0 0 0 10px transparent}100%{box-shadow:0 0 0 0 transparent}}',
    '.kkp-card.kkp-card-in-next{animation:kkp-card-next .26s ease-out}',
    '.kkp-card.kkp-card-in-prev{animation:kkp-card-prev .26s ease-out}',
    '@keyframes kkp-card-next{from{transform:translateX(40px);opacity:.4}to{transform:none;opacity:1}}',
    '@keyframes kkp-card-prev{from{transform:translateX(-40px);opacity:.4}to{transform:none;opacity:1}}',
    '@media (prefers-reduced-motion:reduce){.kkp-card.kkp-card-in-next,.kkp-card.kkp-card-in-prev,.kkp-cards-next.kkp-card-ready{animation:none}}',
    /* 0.39.2: ilk açılışta kaydırma ipucu — sağdan sola kayan parmak izi + yazı, kart hafifçe sola esner */
    '@media (hover:none){.kkp-card{cursor:pointer}}', /* iOS Safari: dokunuşta click olayı için */
    '.kkp-cards-hint{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:5;display:flex;flex-direction:column;align-items:center;gap:12px;padding:18px 24px 16px;border-radius:18px;background:rgba(10,12,16,.78);color:#fff;font-size:15px;font-weight:600;text-align:center;pointer-events:none;box-shadow:0 12px 40px rgba(0,0,0,.4);animation:kkp-hint-in .3s ease-out}',
    '.kkp-cards-hint[hidden]{display:none}',
    '.kkp-cards-hint.kkp-hint-out{opacity:0;transition:opacity .3s}',
    '.kkp-hint-track{position:relative;width:132px;height:34px}',
    '.kkp-hint-track::before{content:"";position:absolute;left:8px;right:8px;top:16px;height:2px;border-radius:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35))}',
    '.kkp-hint-dot{position:absolute;right:0;top:5px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 0 0 7px rgba(255,255,255,.22);animation:kkp-hint-swipe 1.7s ease-in-out infinite}',
    '@keyframes kkp-hint-swipe{0%{transform:translateX(0) scale(.85);opacity:0}15%{transform:translateX(0) scale(1);opacity:1}70%{transform:translateX(-108px) scale(1);opacity:1}100%{transform:translateX(-108px) scale(.85);opacity:0}}',
    '@keyframes kkp-hint-in{from{opacity:0;transform:translate(-50%,-44%)}to{opacity:1;transform:translate(-50%,-50%)}}',
    '.kkp-card.kkp-card-peek{animation:kkp-card-peek 1.7s ease-in-out 2}',
    '@keyframes kkp-card-peek{0%,100%{transform:none}38%{transform:translateX(-22px)}62%{transform:none}}',
    '@media (prefers-reduced-motion:reduce){.kkp-hint-dot{animation:none;opacity:1;transform:translateX(-54px)}.kkp-card.kkp-card-peek,.kkp-cards-hint{animation:none}}',
    '.kkp-cards-msg{position:absolute;left:50%;bottom:76px;transform:translateX(-50%);max-width:90%;padding:8px 14px;border-radius:10px;background:var(--kkp-btn);color:var(--kkp-fg);font-size:13px;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.35)}',
    '.kkp-cards-msg[hidden]{display:none}',
    /* 0.38: podcast modu — slaytların üstünde tam ekran dinleme görünümü */
    '.kkp-pod-btn.kkp-float{padding:0 16px 0 12px;font-weight:600;gap:8px}',
    '.kkp-pod-btn svg{width:18px;height:18px}',
    '.kkp-start .kkp-start-pod{display:inline-flex;align-items:center;gap:8px}',
    '.kkp-start .kkp-start-pod svg{width:18px;height:18px}',
    '.kkp-pod{position:absolute;inset:0;z-index:70;overflow:auto;background:var(--kkp-bg);color:var(--kkp-fg);display:flex;flex-direction:column;align-items:center}',
    '.kkp-pod::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(70% 45% at 50% 0,var(--kkp-accent),transparent 70%);opacity:.25}',
    '.kkp-pod[hidden]{display:none}',
    '.kkp-pod-in{position:relative;width:100%;max-width:560px;padding:18px 20px 28px;box-sizing:border-box;display:flex;flex-direction:column;gap:14px}',
    '.kkp-pod-head{display:flex;align-items:center;gap:10px}',
    '.kkp-pod-course{flex:1;min-width:0;font-size:13px;font-weight:600;color:var(--kkp-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.kkp-pod-back{gap:6px;padding:0 14px 0 10px}',
    '.kkp-pod-back svg{width:16px;height:16px}',
    '.kkp-pod-art{align-self:center;width:min(220px,48vw);aspect-ratio:1;border-radius:28px;display:flex;align-items:center;justify-content:center;background:var(--kkp-accent);color:var(--kkp-on-accent);box-shadow:0 24px 60px -20px var(--kkp-accent)}',
    '.kkp-pod-art svg{width:46%;height:46%}',
    '.kkp-pod-now{text-align:center}',
    '.kkp-pod-no{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--kkp-muted)}',
    '.kkp-pod-name{margin-top:4px;font-size:20px;font-weight:700;line-height:1.3}',
    '.kkp-pod-cc{min-height:2.6em;text-align:center;font-size:15px;line-height:1.3;color:var(--kkp-soft)}',
    '.kkp-pod-bar{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--kkp-muted);font-variant-numeric:tabular-nums}',
    '.kkp-pod-range{flex:1;min-width:0;accent-color:var(--kkp-accent);margin:0}',
    /* 1fr | önceki | 10 sn geri | OYNAT | 10 sn ileri | sonraki | 1fr (hız): kenar sütunlar eşit olduğu için oynat tam ortada */
    '.kkp-pod-ctl{display:grid;grid-template-columns:1fr repeat(5,auto) 1fr;align-items:center;column-gap:10px}',
    '.kkp-pod-prev{grid-column:2}',
    '.kkp-pod-ctl .kkp-pod-rate{grid-column:7;justify-self:start;margin-left:6px}',
    '.kkp-pod-ctl .kkp-ctl{flex:0 0 auto;width:44px;height:44px}',
    '.kkp-pod-ctl .kkp-ctl svg{width:24px;height:24px}',
    '.kkp-pod-ctl .kkp-pod-play.kkp-ctl{width:64px;height:64px;border-radius:50%;background:var(--kkp-accent);color:var(--kkp-on-accent)}',
    '.kkp-pod-play.kkp-ctl:hover:not(:disabled){background:var(--kkp-accent);filter:brightness(.92)}',
    '.kkp-pod-play.kkp-ctl svg{width:30px;height:30px}',
    '.kkp-pod-rate.kkp-ctl{width:auto;min-width:48px;padding:0 8px;font-size:13px;font-weight:700}',
    '@media (max-width:420px){.kkp-pod-ctl{column-gap:4px}.kkp-pod-ctl .kkp-ctl{width:40px;height:40px}.kkp-pod-rate.kkp-ctl{min-width:44px}}',
    '.kkp-pod-list-head{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--kkp-muted);margin-top:6px}',
    '.kkp-pod-list{display:flex;flex-direction:column;gap:4px}',
    '.kkp-pod-item{display:flex;align-items:center;gap:10px;width:100%;min-height:44px;padding:6px 12px;border:1px solid transparent;border-radius:10px;background:transparent;color:inherit;font:inherit;font-size:14px;text-align:left;cursor:pointer}',
    '.kkp-pod-item:hover{background:var(--kkp-btn)}',
    '.kkp-pod-item[aria-current]{background:var(--kkp-btn);border-color:var(--kkp-accent)}',
    '.kkp-pod-item:focus-visible{outline:2px solid var(--kkp-accent);outline-offset:-2px}',
    '.kkp-pod-ino{flex:0 0 26px;font-size:12px;font-weight:700;color:var(--kkp-muted);font-variant-numeric:tabular-nums}',
    '.kkp-pod-iname{flex:1;min-width:0}',
    '.kkp-pod-item .kkp-menu-seen{flex:0 0 18px}',
    /* 0.38.2: dar oynatıcı (telefon; .kkp-narrow, genişliğe göre fit() koyar) — denetim çubuğu iki satır: üstte geçen | süre
       çubuğu | kalan, altta düğmeler (Önceki/Sonraki yalnızca simge, sağa yaslı). Satır sonu .kkp-seek-break ile zorlanır */
    '.kkp-seek-break{display:none}',
    '.kkp-narrow .kkp-seek{flex-wrap:wrap;row-gap:2px;column-gap:2px;padding-left:8px;padding-right:8px}',
    '.kkp-narrow .kkp-seek.kkp-over{padding-top:28px}',
    '.kkp-narrow .kkp-seek-time,.kkp-narrow .kkp-seek-track,.kkp-narrow .kkp-seek-remain,.kkp-narrow .kkp-seek .kkp-count{order:-2}',
    '.kkp-narrow .kkp-seek-track{flex:1 1 0;margin:0 6px}',
    '.kkp-narrow .kkp-seek-break{display:block;order:-1;flex:0 0 100%;height:0}',
    '.kkp-narrow .kkp-seek-spacer,.kkp-narrow .kkp-progress{display:none}',
    '.kkp-narrow .kkp-ctl{width:34px;height:34px;flex-basis:34px}',
    '.kkp-narrow .kkp-seek .kkp-nav{margin:0 2px 0 auto;gap:6px}',
    '.kkp-narrow .kkp-seek .kkp-nav span{display:none}',
    '.kkp-narrow .kkp-seek .kkp-nav .kkp-btn{box-sizing:border-box;width:34px;min-width:0;height:34px;padding:0;justify-content:center}',
    '.kkp-tiny .kkp-seek{padding-left:4px;padding-right:4px}',
    '.kkp-tiny .kkp-ctl{width:28px;height:32px;flex-basis:28px}',
    '.kkp-tiny .kkp-ctl svg{width:18px;height:18px}',
    '.kkp-tiny .kkp-seek .kkp-nav{gap:3px}',
    '.kkp-tiny .kkp-seek .kkp-nav .kkp-btn{width:30px;height:30px}',
    '.kkp-tiny .kkp-seek .kkp-nav .kkp-btn svg{width:16px;height:16px}',
    '.kkp-narrow .kkp-cc-lift{bottom:112px}',
    '.kkp-narrow.kkp-idle .kkp-cc-lift{bottom:5%}',
    '@media (max-width:640px){.kkp-progress{display:none}.kkp-seek .kkp-nav span{display:none}.kkp-seek .kkp-nav .kkp-btn{padding:0 8px}}'
  ].join('\n');

  var ICONS = {
    // 0.39: mikro-öğrenme kartları (kendi çizimimiz: üst üste iki kart)
    cards: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><rect x="7.5" y="3" width="11" height="15" rx="2.2"/><path d="M5.5 6.2v12.3A2.5 2.5 0 0 0 8 21h8.6"/></svg>',
    // 0.38: podcast modu (kendi çizimlerimiz)
    headphones: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 15.5V12a8 8 0 0 1 16 0v3.5"/><rect x="3.2" y="13.6" width="4.8" height="7" rx="1.7" fill="currentColor"/><rect x="16" y="13.6" width="4.8" height="7" rx="1.7" fill="currentColor"/></svg>',
    trackPrev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2.2v14H6zM19.5 5.6v12.8L9.6 12z"/></svg>',
    trackNext: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.8 5H18v14h-2.2zM4.5 5.6 14.4 12l-9.9 6.4z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 10v4h4l5 4V6L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>',
    prev: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z"/></svg>',
    next: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/></svg>',
    replay: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11z"/></svg>',
    // 0.16: denetim çubuğu ve menü
    back10: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5.2 8.6A8 8 0 1 1 4 12.5"/><path d="M4.6 4.4v4.5h4.5"/><text x="12.6" y="15.6" font-size="7.2" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial,sans-serif">10</text></svg>',
    fwd10: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18.8 8.6A8 8 0 1 0 20 12.5"/><path d="M19.4 4.4v4.5h-4.5"/><text x="11.4" y="15.6" font-size="7.2" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial,sans-serif">10</text></svg>',
    vol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h3.5L12 18V6L7.5 9.5z" fill="currentColor" stroke="none"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
    cc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M10.5 10.3a2.3 2.3 0 1 0 0 3.4M17 10.3a2.3 2.3 0 1 0 0 3.4"/></svg>',
    volOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h3.5L12 18V6L7.5 9.5z" fill="currentColor" stroke="none"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M10.3 3.5h3.4l.5 2.4a6.6 6.6 0 0 1 1.7 1l2.3-.8 1.7 3-1.8 1.6a6.7 6.7 0 0 1 0 2l1.8 1.6-1.7 3-2.3-.8a6.6 6.6 0 0 1-1.7 1l-.5 2.4h-3.4l-.5-2.4a6.6 6.6 0 0 1-1.7-1l-2.3.8-1.7-3 1.8-1.6a6.7 6.7 0 0 1 0-2L4.2 9.1l1.7-3 2.3.8a6.6 6.6 0 0 1 1.7-1z"/><circle cx="12" cy="12" r="2.8"/></svg>',
    fs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>',
    fsExit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5"/></svg>',
    check: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.5 12.4l3 3 6-6.4" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    playCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M10.2 8.6v6.8l5.2-3.4z" fill="currentColor" stroke="none"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>'
  };

  /**
   * Oynatıcı ayarları (course.player). Kursla birlikte kaydedilir ve pakete yazılır.
   * Yeni ayar eklerken varsayılanını burada verin; editör eksikleri bununla tamamlar.
   */
  var PLAYER_DEFAULTS = {
    // denetimler (0.6: seekbar; 0.12: diğerleri)
    // denetim çubuğu (0.16, video oynatıcı gibi); her biri ayrı açılıp kapanır
    playPause: true,    // oynat / duraklat
    skip: true,         // 10 sn geri / ileri sar
    seekbar: true,      // süre çubuğu (tıklayıp / sürükleyip sarma)
    time: true,         // geçen ve kalan süre
    volume: true,       // ses aç / kapat (tüm video ve sesler)
    speed: true,        // 0.13: oynatma hızı (⚙ menüsü; 0,5× – 2×; slaydın zamanı, video ve ses birlikte); 0.30.1'den itibaren varsayılan açık
    fullscreen: true,   // tam ekran (LMS çerçevesi izin vermiyorsa görünmez)
    captions: true,     // 0.22: altyazı (CC) düğmesi; yalnızca kursta altyazılı video/ses varsa görünür
    captionsOn: true,   // 0.22: altyazılar başlangıçta açık (öğrenci CC düğmesiyle kapatabilir)
    controlsPos: 'overlay', // 'overlay': slaydın üstünde, fare durunca gizlenir | 'below': slaydın altında
    prevNext: true,     // Önceki / Sonraki düğmeleri (kapalıysa ok tuşlarıyla da gezinilmez; gezinme tetikleyicilerle)
    replay: false,      // slaydı baştan oynat düğmesi (0.30.1'den itibaren varsayılan kapalı)
    title: false,       // slayt adı (sol üstte; 0.19.2'den itibaren varsayılan kapalı)
    counter: true,      // "3 / 10"
    progress: true,     // kurs ilerleme çubuğu
    menu: true,         // menü düğmesi + slayt listesi paneli
    startScreen: true,  // LMS paketinde "Başla" ekranı
    // renkler
    theme: 'dark',      // 'dark' | 'light'
    accent: '#cd1e47',  // düğmeler, süre çubuğu, ilerleme (0.37'ye kadar #3b5bdb)
    // gezinme
    navigation: 'free', // 'free': menüden her slayta gidilir | 'sequential': yalnızca görülen slaytlar ve sıradaki
    lockNext: false,    // slayt sonuna gelmeden "Sonraki" kilitli (süre çubuğuyla da ileri sarılamaz)
    resume: 'ask',      // LMS'te kaldığı yer: 'ask' sor | 'auto' kendiliğinden devam | 'never' hep baştan
    labels: null        // düğme metinleri (LABEL_DEFAULTS'u ezer)
  };

  /** Oynatıcıdaki yazılar; oynatıcı ayarlarındaki "Metinler"den değiştirilebilir */
  var LABEL_DEFAULTS = {
    prev: 'Önceki',
    next: 'Sonraki',
    replay: 'Baştan oynat',
    menu: 'Menü',
    start: 'Başla',
    resume: 'Devam et',
    restart: 'Baştan başla',
    resumePrompt: 'Kaldığınız yerden devam etmek ister misiniz?',
    play: 'Oynat',
    pause: 'Duraklat',
    speed: 'Oynatma hızı',
    speedNormal: 'Normal',
    lockedNext: 'Slayt bitince devam edebilirsiniz',
    quizPick: 'Lütfen bir cevap seçin.',
    quizLocked: 'Devam etmek için soruyu cevaplayın.',
    quizType: 'Lütfen cevabınızı yazın.',
    quizClick: 'Lütfen resimde bir yere tıklayın.',
    tapToPlay: 'Oynatmak için tıklayın',
    mediaError: 'Bu video bu tarayıcıda oynatılamıyor (MP4 / H.264 biçimi önerilir).',
    skipBack: '10 sn geri',
    skipForward: '10 sn ileri',
    mute: 'Sesi kapat',
    unmute: 'Sesi aç',
    fullscreen: 'Tam ekran',
    exitFullscreen: 'Tam ekrandan çık',
    ccOn: 'Altyazıları aç',
    ccOff: 'Altyazıları kapat',
    section: 'Bölüm',
    close: 'Kapat',
    cards: 'Kartlar',                             // 0.39: mikro-öğrenme kartları
    cardsOpen: 'Kartlarla incele',
    cardsBack: 'Slaytlara dön',
    cardsHint: 'Sonraki kart için sola kaydırın',  // 0.39.2: ilk açılıştaki ipucu
    podcast: 'Podcast',                           // 0.38: podcast modu
    podcastListen: 'Podcast olarak dinle',
    podcastBack: 'Slaytlara dön',
    podcastChapters: 'Bölümler',
    exitTitle: 'Kurstan çıktınız',                // 0.28: "Kurstan çık" tetikleyicisinden sonra (pencere kapanmadıysa)
    exitNote: 'Bu pencereyi kapatabilirsiniz.'
  };

  /** Oynatma hızı seçenekleri */
  var SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
  /** 1.25 -> "1,25×" */
  function speedText(r) { return String(r).replace('.', ',') + '×'; }

  var PLAYER_ENUMS = { controlsPos: ['overlay', 'below'], theme: ['dark', 'light'], navigation: ['free', 'sequential'], resume: ['ask', 'auto', 'never'] };

  /** Eksik/yanlış değerleri varsayılanla tamamlar (eski projeler ve elle düzenlenmiş dosyalar için) */
  function playerSettings(p) {
    var out = {}, k, d;
    p = p && typeof p === 'object' ? p : {};
    for (k in PLAYER_DEFAULTS) {
      if (!PLAYER_DEFAULTS.hasOwnProperty(k) || k === 'labels') continue;
      d = PLAYER_DEFAULTS[k];
      var v = p.hasOwnProperty(k) ? p[k] : d;
      if (typeof d === 'boolean') v = typeof v === 'boolean' ? v : d;
      else if (PLAYER_ENUMS[k]) v = PLAYER_ENUMS[k].indexOf(v) >= 0 ? v : d;
      else if (k === 'accent') v = /^#[0-9a-f]{6}$/i.test(v || '') ? v.toLowerCase() : d;
      out[k] = v;
    }
    // 0.16 öncesi: süre çubuğu kapalı projelerde yeni denetimler de kapalı başlasın (görünüm değişmesin)
    if (p.seekbar === false && !p.hasOwnProperty('playPause')) out.playPause = out.skip = out.time = out.volume = out.fullscreen = false;
    out.labels = {};
    var L = p.labels && typeof p.labels === 'object' ? p.labels : {};
    for (k in LABEL_DEFAULTS) {
      if (!LABEL_DEFAULTS.hasOwnProperty(k)) continue;
      var t = typeof L[k] === 'string' ? L[k].replace(/^\s+|\s+$/g, '') : '';
      if (t && t !== LABEL_DEFAULTS[k]) out.labels[k] = t.slice(0, 120); // yalnızca değiştirilenler saklanır
    }
    return out;
  }

  /** Görünen metin: ayarda değiştirildiyse o, değilse varsayılan */
  function playerLabel(settings, key) {
    return (settings && settings.labels && settings.labels[key]) || LABEL_DEFAULTS[key] || '';
  }

  /** Vurgu renginin üstündeki yazı: açık renklerde koyu */
  function onAccent(hex) {
    var n = parseInt(String(hex).slice(1), 16);
    if (isNaN(n)) return '#fff';
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) > 165 ? '#1f2430' : '#fff';
  }

  /** 75 → "1:15" */
  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec + 0.001));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function injectCSS(doc) {
    doc = doc || document;
    if (doc.getElementById('kkp-style')) return;
    var s = doc.createElement('style');
    s.id = 'kkp-style';
    s.textContent = CSS;
    doc.head.appendChild(s);
  }

  /*
   * Temel şekiller. pts: 0..1 kutusunda çokgen köşeleri; text: şekil içi yazı alanının
   * kenarlardan uzaklığı [üst, sağ, alt, sol] (kutunun oranı olarak).
   */
  var SHAPES = (function () {
    function star(n, inner) {
      var pts = [], i, a, r, minX = 1, maxX = 0, minY = 1, maxY = 0;
      for (i = 0; i < n * 2; i++) {
        a = -Math.PI / 2 + i * Math.PI / n;
        r = i % 2 ? inner : 1;
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      for (i = 0; i < pts.length; i++) {
        minX = Math.min(minX, pts[i][0]); maxX = Math.max(maxX, pts[i][0]);
        minY = Math.min(minY, pts[i][1]); maxY = Math.max(maxY, pts[i][1]);
      }
      for (i = 0; i < pts.length; i++) {
        pts[i] = [(pts[i][0] - minX) / (maxX - minX), (pts[i][1] - minY) / (maxY - minY)];
      }
      return pts;
    }
    return {
      rect: { label: 'Dikdörtgen / kare' },
      roundRect: { label: 'Yuvarlak köşeli dikdörtgen' },
      ellipse: { label: 'Daire / elips', text: [0.12, 0.12, 0.12, 0.12] },
      triangle: { label: 'Üçgen', pts: [[0.5, 0], [1, 1], [0, 1]], text: [0.4, 0.2, 0.03, 0.2] },
      rightTriangle: { label: 'Dik üçgen', pts: [[0, 0], [1, 1], [0, 1]], text: [0.45, 0.4, 0.03, 0.03] },
      diamond: { label: 'Eşkenar dörtgen', pts: [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]], text: [0.22, 0.2, 0.22, 0.2] },
      pentagon: { label: 'Beşgen', pts: [[0.5, 0], [1, 0.38], [0.81, 1], [0.19, 1], [0, 0.38]], text: [0.2, 0.1, 0.03, 0.1] },
      hexagon: { label: 'Altıgen', pts: [[0.25, 0], [0.75, 0], [1, 0.5], [0.75, 1], [0.25, 1], [0, 0.5]], text: [0.05, 0.12, 0.05, 0.12] },
      octagon: { label: 'Sekizgen', pts: [[0.29, 0], [0.71, 0], [1, 0.29], [1, 0.71], [0.71, 1], [0.29, 1], [0, 0.71], [0, 0.29]], text: [0.06, 0.06, 0.06, 0.06] },
      star: { label: 'Yıldız', pts: star(5, 0.4), text: [0.3, 0.25, 0.2, 0.25] },
      arrowRight: { label: 'Ok', pts: [[0, 0.28], [0.62, 0.28], [0.62, 0], [1, 0.5], [0.62, 1], [0.62, 0.72], [0, 0.72]], text: [0.28, 0.2, 0.28, 0.02] },
      parallelogram: { label: 'Paralelkenar', pts: [[0.2, 0], [1, 0], [0.8, 1], [0, 1]], text: [0, 0.12, 0, 0.12] },
      trapezoid: { label: 'Yamuk', pts: [[0.2, 0], [0.8, 0], [1, 1], [0, 1]], text: [0, 0.12, 0, 0.12] },
      plus: { label: 'Artı', pts: [[0.35, 0], [0.65, 0], [0.65, 0.35], [1, 0.35], [1, 0.65], [0.65, 0.65], [0.65, 1], [0.35, 1], [0.35, 0.65], [0, 0.65], [0, 0.35], [0.35, 0.35]], text: [0.35, 0, 0.35, 0] },
      bubble: { label: 'Konuşma balonu', pts: [[0, 0], [1, 0], [1, 0.75], [0.42, 0.75], [0.18, 1], [0.24, 0.75], [0, 0.75]], text: [0, 0, 0.25, 0] }
    };
  })();

  /*
   * --- öğe durumları (0.10, 0.11) ---
   * Durum = { id, name, props, geo?, extras? }
   *  props : STATE_KEYS[tür] içinden "Normal"den farklı olan görünüm özellikleri
   *  geo   : { dx, dy, dw, dh } Normal'e göre konum/boyut farkı (öğe slaytta taşınınca durumlar da onunla gelir)
   *  extras: yalnızca bu durumda görünen nesneler (metin/şekil/görsel); x/y öğenin bu durumdaki sol üst köşesine göre
   * Zamanlama ve tetikleyiciler tüm durumlarda ortaktır.
   */
  var STATE_KEYS = {
    text: ['text', 'color', 'fill', 'bold', 'italic', 'fontSize', 'fontFamily', 'align'],
    shape: ['shape', 'fill', 'stroke', 'strokeWidth', 'radius', 'opacity', 'shadow', 'text', 'color', 'bold', 'italic', 'fontSize', 'fontFamily', 'align', 'valign'],
    image: ['mediaId']
  };

  function findState(e, id) {
    var list = e.states || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  /** Öğenin bir durumdaki görünümü: 'normal' = öğenin kendisi; diğerlerinde durumun özellikleri üstüne yazılır */
  function stateView(e, id) {
    if (!id || id === 'normal') return e;
    var st = findState(e, id);
    var keys = STATE_KEYS[e.type];
    if (!st || !keys) return e;
    var v = {}, k, i;
    for (k in e) if (e.hasOwnProperty(k)) v[k] = e[k];
    for (i = 0; i < keys.length; i++) if (st.props && st.props.hasOwnProperty(keys[i])) v[keys[i]] = st.props[keys[i]];
    var g = st.geo;
    if (g) {
      v.x = e.x + (+g.dx || 0);
      v.y = e.y + (+g.dy || 0);
      v.w = Math.max(8, e.w + (+g.dw || 0));
      v.h = Math.max(8, e.h + (+g.dh || 0));
    }
    v.extras = st.extras || [];
    return v;
  }

  function safeColor(c, fallback) { return /^#[0-9a-f]{3,8}$/i.test(c || '') ? c : fallback; }

  /** Şeklin SVG'si, öğenin gerçek piksel boyutunda (kenar çizgisi bozulmasın diye ölçeklenmez) */
  function shapeMarkup(kind, w, h, st) {
    w = Math.max(1, +w || 1); h = Math.max(1, +h || 1);
    var sw = Math.max(0, Math.min(+st.strokeWidth || 0, Math.min(w, h) / 2));
    var s = sw / 2, iw = w - sw, ih = h - sw;
    var fill = st.fill ? safeColor(st.fill, 'none') : 'none';
    var stroke = sw > 0 ? safeColor(st.stroke, '#1f2430') : 'none';
    var attrs = ' fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linejoin="round"';
    var def = SHAPES[kind] || SHAPES.rect, body;
    if (kind === 'ellipse') {
      body = '<ellipse cx="' + (w / 2) + '" cy="' + (h / 2) + '" rx="' + (iw / 2) + '" ry="' + (ih / 2) + '"' + attrs + '/>';
    } else if (def.pts) {
      var p = [];
      for (var i = 0; i < def.pts.length; i++) {
        p.push((s + def.pts[i][0] * iw).toFixed(2) + ',' + (s + def.pts[i][1] * ih).toFixed(2));
      }
      body = '<polygon points="' + p.join(' ') + '"' + attrs + '/>';
    } else {
      var r = kind === 'roundRect' ? Math.max(0, Math.min(+st.radius || 0, iw / 2, ih / 2)) : 0;
      body = '<rect x="' + s + '" y="' + s + '" width="' + iw + '" height="' + ih + '" rx="' + r + '" ry="' + r + '"' + attrs + '/>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true" focusable="false">' + body + '</svg>';
  }

  /*
   * Hotspot (0.30): görünmez tıklama alanı (Storyline'daki gibi). hsShape: 'oval' | 'rect' | 'free';
   * free'de points = [[x, y], …] öğenin kutusuna göre 0..1 (kutu büyüyünce çokgen de ölçeklenir). SVG 0..100 viewBox'ta
   * ölçeklenir; kenar çizgisi non-scaling-stroke. Oynatıcıda dolgu ve çizgi yok, yalnızca alan tıklanır; editörde
   * kesikli çerçeve + yarı saydam dolgu.
   */
  var HOTSPOT_SHAPES = { oval: 'Oval', rect: 'Dikdörtgen', free: 'Serbest biçim' };
  function hotspotPoints(e) {
    var p = e && e.points, out = [];
    if (!p || !p.length) return null;
    for (var i = 0; i < p.length; i++) {
      var x = p[i] && +p[i][0], y = p[i] && +p[i][1];
      if (isFinite(x) && isFinite(y)) out.push([Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y))]);
    }
    return out.length >= 3 ? out : null;
  }
  function hotspotMarkup(e, mode) {
    var kind = e.hsShape, body, pts = kind === 'free' ? hotspotPoints(e) : null;
    var attrs = mode === 'player'
      ? ' fill="none" stroke="none"'
      : ' fill="rgba(76,110,245,.16)" stroke="#3b5bdb" stroke-width="1.5" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"';
    if (pts) {
      var a = [];
      for (var i = 0; i < pts.length; i++) a.push((pts[i][0] * 100).toFixed(2) + ',' + (pts[i][1] * 100).toFixed(2));
      body = '<polygon points="' + a.join(' ') + '"' + attrs + '/>';
    } else if (kind === 'oval') body = '<ellipse cx="50" cy="50" rx="50" ry="50"' + attrs + '/>';
    else body = '<rect x="0" y="0" width="100" height="100"' + attrs + '/>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">' + body + '</svg>';
  }
  /** Nokta (sahne koordinatı) hotspot'un / şeklin içinde mi (sıcak nokta sorusu) */
  function pointInElement(e, p) {
    var u = (p.x - e.x) / (e.w || 1), v = (p.y - e.y) / (e.h || 1);
    if (u < 0 || u > 1 || v < 0 || v > 1) return false;
    var oval = (e.type === 'hotspot' && e.hsShape === 'oval') || (e.type === 'shape' && (e.shape === 'circle' || e.shape === 'ellipse'));
    if (oval) { var dx = u * 2 - 1, dy = v * 2 - 1; return dx * dx + dy * dy <= 1; }
    var pts = e.type === 'hotspot' && e.hsShape === 'free' ? hotspotPoints(e) : null;
    if (!pts) return true;
    var inside = false; // çift-tek kuralı
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if ((yi > v) !== (yj > v) && u < (xj - xi) * (v - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  var FONT_STACK = '"Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif';

  /** Öğenin yazı tipi (boşsa varsayılan); pakette @font-face ile gömülü dosyadan yüklenir */
  function fontCss(family) {
    var f = String(family || '').replace(/["\\;{}<>]/g, '').trim();
    return f ? '"' + f + '",' + FONT_STACK : '';
  }

  function styleText(n, e, defaults) {
    if (e.fontFamily) n.style.fontFamily = fontCss(e.fontFamily);
    n.style.fontSize = (e.fontSize || defaults.fontSize) + 'px';
    n.style.color = e.color || defaults.color;
    n.style.fontWeight = e.bold ? '700' : '400';
    n.style.fontStyle = e.italic ? 'italic' : 'normal';
    n.style.textAlign = e.align || defaults.align;
  }

  function h(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /**
   * Bir öğenin içeriğini oluşturur. Konumlandırmayı çağıran yapar.
   * mode: 'player' (oynatıcı), 'editor' (düzenleme sahnesi), 'thumb' (küçük resim)
   */
  function buildContent(e, resolveMedia, mode) {
    var url = e.mediaId ? resolveMedia(e.mediaId) : null;
    var n;
    if (e.type === 'input') { // 0.25: öğrencinin yazdığı kutu (editörde yalnızca görünüm)
      if (mode === 'player') {
        n = document.createElement('input');
        n.type = 'text';
        n.className = 'kkp-input';
        n.placeholder = e.placeholder || '';
        n.maxLength = 500;
        n.setAttribute('autocomplete', 'off');
        n.setAttribute('spellcheck', 'false');
        n.setAttribute('aria-label', e.name || e.placeholder || 'Cevap');
      } else {
        n = h('div', 'kkp-input kkp-input-ph');
        n.textContent = e.placeholder || '';
      }
      n.style.fontSize = (+e.fontSize || 22) + 'px';
      n.style.color = safeColor(e.color) || '#1f2430';
      n.style.background = safeColor(e.fill) || '#ffffff';
      n.style.borderColor = safeColor(e.stroke) || '#adb5bd';
      n.style.borderWidth = Math.max(0, Math.min(20, +e.strokeWidth >= 0 ? +e.strokeWidth : 2)) + 'px';
      n.style.borderRadius = Math.max(0, +e.radius || 0) + 'px';
      return n;
    }
    if (e.type === 'hotspot') {
      n = h('div', 'kkp-hotspot' + (mode === 'player' ? '' : ' kkp-hotspot-ed'));
      if (mode !== 'thumb') n.innerHTML = hotspotMarkup(e, mode); // küçük resimde görünmez (kursta da görünmez)
      return n;
    }
    if (e.type === 'text') {
      n = h('div', 'kkp-text');
      n.textContent = e.text || '';
      styleText(n, e, { fontSize: 28, color: '#1f2430', align: 'left' });
      if (e.fill) n.style.background = e.fill;
      return n;
    }
    if (e.type === 'shape') {
      n = h('div', 'kkp-shape' + (e.shadow ? ' kkp-shadow' : ''));
      n.innerHTML = shapeMarkup(e.shape, e.w, e.h, e);
      if (e.opacity != null && +e.opacity < 100) n.firstChild.style.opacity = String(Math.max(0, +e.opacity) / 100);
      var ins = (SHAPES[e.shape] || {}).text || [0, 0, 0, 0];
      var lab = h('div', 'kkp-shape-label');
      lab.style.top = (ins[0] * 100) + '%';
      lab.style.right = (ins[1] * 100) + '%';
      lab.style.bottom = (ins[2] * 100) + '%';
      lab.style.left = (ins[3] * 100) + '%';
      lab.style.alignItems = e.valign === 'top' ? 'flex-start' : e.valign === 'bottom' ? 'flex-end' : 'center';
      var tx = h('div', 'kkp-text');
      tx.textContent = e.text || '';
      styleText(tx, e, { fontSize: 24, color: '#ffffff', align: 'center' });
      lab.appendChild(tx);
      n.appendChild(lab);
      return n;
    }
    if (e.type === 'image') {
      n = document.createElement('img');
      n.className = 'kkp-img';
      n.alt = e.alt || '';
      n.draggable = false;
      if (url) n.src = url;
      return n;
    }
    if (e.type === 'video') {
      if (mode === 'thumb') return h('div', 'kkp-vthumb', ICONS.video);
      n = document.createElement('video');
      n.className = 'kkp-video';
      n.setAttribute('playsinline', '');
      n.preload = mode === 'player' ? 'auto' : 'metadata';
      if (mode === 'player') {
        n.controls = e.controls !== false;
        // hız oynatıcıdan yönetilir (zaman çizelgesiyle uyumlu kalsın): videonun kendi hız menüsü kapalı
        n.setAttribute('controlsList', 'noplaybackrate');
        n.loop = !!e.loop;
        n.muted = !!e.muted;
      } else {
        n.muted = true;
      }
      if (url) n.src = url;
      return n;
    }
    if (e.type === 'audio') {
      var btn = h('button', 'kkp-audio', ICONS.speaker);
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Sesi oynat / durdur');
      if (mode !== 'player') {
        btn.tabIndex = -1;
        return btn;
      }
      var a = document.createElement('audio');
      a.preload = 'auto';
      a.loop = !!e.loop;
      if (url) a.src = url;
      btn.appendChild(a);
      btn.addEventListener('click', function () {
        if (a.paused) a.play().catch(function () {});
        else a.pause();
      });
      a.addEventListener('play', function () { btn.classList.add('is-playing'); btn.firstChild.outerHTML = ICONS.pause; });
      a.addEventListener('pause', function () { btn.classList.remove('is-playing'); btn.firstChild.outerHTML = ICONS.speaker; });
      if (e.showIcon === false) btn.style.visibility = 'hidden';
      return btn;
    }
    return h('div');
  }

  /**
   * Altyazılar (0.22): video/ses öğesinin captions listesi [{ id, start, end, text }], zamanlar medyanın kendi
   * saniyesi (currentTime). t anındaki altyazı (yoksa null); liste başlangıca göre sıralıdır, çakışma yoktur.
   */
  /*
   * Podcast modu (0.38): kursun ses parçaları. Her slaydın ANA katmanındaki ses ve video öğeleri, slayt sırasıyla ve slayt
   * içinde giriş zamanına göre. Dahil edilmez: sessiz video, döngüdeki ses/video (genelde arka plan müziği), başlangıçta gizli
   * (tetikleyiciyle gösterilen) ve zaman çizelgesinde gizlenmiş öğeler, katmanlardaki medya. Bitişi ayarlanmış öğe slayttaki
   * süresi kadar çalar (to). resolveMedia adres vermiyorsa atlanır.
   */
  function podcastTracks(course, resolveMedia) {
    var out = [];
    ((course && course.slides) || []).forEach(function (s, si) {
      var list = [];
      (s.elements || []).forEach(function (e, ord) {
        if (e.type !== 'audio' && e.type !== 'video') return;
        if (e.invisible || e.startHidden || e.loop || !e.mediaId) return;
        if (e.type === 'video' && e.muted) return;
        var url = resolveMedia ? resolveMedia(e.mediaId) : null;
        if (!url) return;
        var st = +e.start || 0;
        list.push({ slide: si, e: e, url: url, start: st, to: e.end != null && +e.end > st ? +e.end - st : null, ord: ord });
      });
      list.sort(function (a, b) { return (a.start - b.start) || (a.ord - b.ord); });
      out = out.concat(list);
    });
    return out;
  }
  /* ---------- mikro-öğrenme kartları (0.39) ---------- */
  /** Kart düğmesi açık mı: pakette course.cards, editör önizlemesinde projenin LMS çıktısı ayarı */
  function cardsEnabled(course) {
    return !!course && (course.cards === true || !!(course.lms && course.lms.cards === true));
  }
  /** Kart olan slaytların sıra numaraları ("Kartlarda gösterme" işaretli olanlar hariç) */
  function cardSlides(course) {
    var out = [];
    ((course && course.slides) || []).forEach(function (s, i) { if (!s.noCard) out.push(i); });
    return out;
  }
  /*
   * Kart metni: slaydın "Kart metni" (cardText) yazılmışsa o; yoksa ana katmandaki ses/video altyazıları (anlatımın yazılı hâli,
   * giriş sırasıyla); o da yoksa ana katmandaki metin ve şekil yazıları (yukarıdan aşağı, soldan sağa). Gizlenmiş ve başlangıçta
   * gizli öğeler (geri bildirim vb.) alınmaz.
   */
  function cardText(s, own) {
    if (!s) return '';
    if (own !== false && typeof s.cardText === 'string' && s.cardText.trim()) return s.cardText.trim();
    var els = (s.elements || []).filter(function (e) { return !e.invisible && !e.startHidden; });
    var media = els.filter(function (e) { return (e.type === 'audio' || e.type === 'video') && e.captions && e.captions.length; });
    if (media.length) {
      media.sort(function (a, b) { return (+a.start || 0) - (+b.start || 0); });
      return media.map(function (e) {
        return e.captions.map(function (c) { return String(c.text || '').replace(/\s+/g, ' ').trim(); }).join(' ');
      }).join('\n\n').trim();
    }
    var texts = els.filter(function (e) { return (e.type === 'text' || e.type === 'shape') && e.text && String(e.text).trim(); });
    texts.sort(function (a, b) { return Math.abs(a.y - b.y) > 8 ? a.y - b.y : a.x - b.x; });
    return texts.map(function (e) { return String(e.text).trim(); }).join('\n\n');
  }

  /** Podcast düğmesi açık mı: pakette course.podcast, editör önizlemesinde projenin LMS çıktısı ayarı */
  function podcastEnabled(course) {
    return !!course && (course.podcast === true || !!(course.lms && course.lms.podcast === true));
  }

  function captionAt(list, t) {
    if (!list) return null;
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (t >= c.start && t < c.end) return c;
      if (c.start > t) break;
    }
    return null;
  }

  /** Slaydın toplam süresi (sn): ayarlanan süre ile öğelerin başlangıç/bitişlerinin en büyüğü */
  /*
   * Menü ağacı (0.29). course.menu yoksa menü slaytlardan kurulur: slaydın "section" alanı slayta bağlı olmayan bir
   * başlık olur, o slayt ve sonrakiler onun altında (seviye 1). course.menu varsa (Oynatıcı ayarları → Menü'de
   * özelleştirilmiş) düz bir listedir: [{ id, slideId (null = yalnızca başlık), title ('' = slaydın adı), level, hidden? }];
   * seviye girintidir (0 = en üst). Silinmiş slaytların girdileri atılır; menüde olmayan slaytlar (sonradan eklenen,
   * çoğaltılan) bir önceki slaydın girdisinden — alt başlıklarıyla birlikte — sonra, onun seviyesinde eklenir.
   * Seviyeler 0..MENU_MAX_LEVEL ve bir öncekinin bir fazlasını aşmaz. Menünün sırası slayt sırasını değiştirmez.
   */
  var MENU_MAX_LEVEL = 4;
  function menuTrim(x) { return typeof x === 'string' ? x.replace(/^\s+|\s+$/g, '').slice(0, 120) : ''; }
  function defaultMenu(slides) {
    var out = [], inSec = false;
    for (var i = 0; i < slides.length; i++) {
      var t = menuTrim(slides[i].section);
      if (t) { out.push({ id: 'mh_' + slides[i].id, slideId: null, title: t, level: 0 }); inSec = true; }
      out.push({ id: 'm_' + slides[i].id, slideId: slides[i].id, title: '', level: inSec ? 1 : 0 });
    }
    return out;
  }
  function menuEntries(course) {
    var slides = (course && course.slides) || [];
    if (!course || !Array.isArray(course.menu)) return defaultMenu(slides);
    var bySlide = {}, have = {}, ids = {}, list = [], i, k;
    for (i = 0; i < slides.length; i++) bySlide[slides[i].id] = true;
    function freshId(base) { var id = base, n = 2; while (ids[id]) id = base + '_' + (n++); ids[id] = true; return id; }
    for (i = 0; i < course.menu.length; i++) {
      var m = course.menu[i];
      if (!m || typeof m !== 'object') continue;
      var sid = m.slideId == null || m.slideId === '' ? null : String(m.slideId);
      if (sid !== null && (!bySlide[sid] || have[sid])) continue; // silinmiş ya da ikinci kez geçen slayt
      var title = menuTrim(m.title);
      if (sid === null && !title) continue; // adsız başlık
      var lv = Math.floor(+m.level || 0);
      var e = { id: freshId(m.id ? String(m.id) : (sid ? 'm_' + sid : 'mh')), slideId: sid, title: title,
        level: Math.max(0, Math.min(MENU_MAX_LEVEL, lv)) };
      if (sid !== null && m.hidden) e.hidden = true;
      if (sid !== null) have[sid] = true;
      list.push(e);
    }
    for (i = 0; i < slides.length; i++) {
      if (have[slides[i].id]) continue;
      var at = i === 0 ? 0 : list.length, lvl = 0;
      if (i > 0) {
        for (k = 0; k < list.length; k++) {
          if (list[k].slideId !== slides[i - 1].id) continue;
          lvl = list[k].level; at = k + 1;
          while (at < list.length && list[at].level > lvl) at++;
          break;
        }
      }
      have[slides[i].id] = true;
      list.splice(at, 0, { id: freshId('m_' + slides[i].id), slideId: slides[i].id, title: '', level: lvl });
    }
    var prev = -1;
    for (i = 0; i < list.length; i++) { if (list[i].level > prev + 1) list[i].level = prev + 1; prev = list[i].level; }
    return list;
  }

  function slideDuration(slide) {
    var d = +slide.duration || 0;
    (slide.elements || []).forEach(function (e) {
      d = Math.max(d, +e.start || 0);
      if (e.end != null) d = Math.max(d, +e.end);
    });
    return d;
  }

  /**
   * Bir slaydın ana katmanını verilen kapsayıcıya (sahne boyutunda) çizer.
   * Slayt katmanları (slide.layers) burada çizilmez; oynatıcı onları ayrıca kurar.
   * 'player' kipinde öğeler gizli başlar ve zamanlama listesi döndürülür.
   */
  function renderSlide(stage, slide, course, resolveMedia, mode) {
    stage.innerHTML = '';
    stage.style.width = course.width + 'px';
    stage.style.height = course.height + 'px';
    stage.style.background = slide.background || '#ffffff';
    return renderElements(stage, slide.elements || [], resolveMedia, mode);
  }

  /** Öğe listesini kapsayıcıya ekler; dizi sırası katman sırasıdır (son eleman en önde) */
  function renderElements(container, elements, resolveMedia, mode) {
    var items = [];
    elements.forEach(function (e, i) {
      if (e.invisible) return; // 0.36: zaman çizelgesinde gizlenmiş öğe (göz kapalı) hiç çizilmez
      var wrap = h('div', 'kkp-el' + (e.type === 'shape' ? ' kkp-el-shape' : e.type === 'hotspot' ? ' kkp-el-hs' : ''));
      wrap.style.left = e.x + 'px';
      wrap.style.top = e.y + 'px';
      wrap.style.width = e.w + 'px';
      wrap.style.height = e.h + 'px';
      wrap.style.zIndex = String(i + 1);
      var c = buildContent(e, resolveMedia, mode);
      wrap.appendChild(c);
      container.appendChild(wrap);
      if (mode === 'player') {
        wrap.style.visibility = 'hidden';
        var mediaEl = e.type === 'video' ? c : e.type === 'audio' ? c.querySelector('audio') : null;
        if (mediaEl) mediaEl.setAttribute('data-kk-muted', e.muted ? '1' : '0'); // ses düğmesi kapatıp açınca geri dönülecek
        items.push({
          e: e,
          wrap: wrap,
          media: mediaEl,
          autoplay: e.type === 'video' ? !!e.autoplay : e.type === 'audio' ? e.autoplay !== false : false,
          shown: false,
          hidden: !!e.startHidden, // tetikleyicilerle değişir
          content: c,
          view: e,                 // güncel durumdaki görünüm (durum yoksa öğenin kendisi)
          stateId: 'normal'
        });
      }
    });
    return items;
  }

  function createPlayer(root, course, opts) {
    opts = opts || {};
    injectCSS(root.ownerDocument);
    var resolveMedia = opts.resolveMedia || function (id) { return course.media[id] && course.media[id].path; };
    var slides = course.slides || [];
    var settings = playerSettings(course.player);
    var last = Math.max(slides.length - 1, 0);
    var index = Math.min(Math.max(opts.startIndex || 0, 0), last);
    // LMS'te kaldığı yer (paket verir): ayara göre sor / kendiliğinden devam / hep baştan
    var resumeAt = Math.min(Math.max(+opts.resumeIndex || 0, 0), last);
    var askResume = !!opts.startScreen && resumeAt > 0 && settings.resume === 'ask';
    // sorulacaksa da kalınan slayt arkada hazır beklesin (LMS'teki konum, öğrenci seçmeden 0'a dönmesin)
    if (resumeAt > 0 && (settings.resume === 'auto' || askResume)) index = resumeAt;
    var showStart = !!opts.startScreen && (settings.startScreen || askResume);
    var started = !showStart;
    function lb(k) { return playerLabel(settings, k); }
    var rate = 1; // oynatma hızı (bkz. setRate); slayt değişince korunur

    // görülen slaytlar (menü işaretleri, sıralı gezinme) ve sonuna kadar izlenenler ("Sonraki" kilidi)
    var visited = {}, done = {};
    (opts.visited || []).forEach(function (v) { v = +v; if (v >= 0 && v <= last) { visited[v] = true; done[v] = true; } });
    var reachedT = 0; // bu slaytta oynatılan en ileri an (kilitliyken ileri sarma sınırı)

    var wrap = h('div', 'kkp' + (settings.theme === 'light' ? ' kkp-light' : ''));
    wrap.style.setProperty('--kkp-accent', settings.accent);
    wrap.style.setProperty('--kkp-on-accent', onAccent(settings.accent));
    var viewport = h('div', 'kkp-viewport');
    var stage = h('div', 'kkp-stage');
    viewport.appendChild(stage);
    // altyazı alanı (0.22): slaydın üstünde, alt ortada
    var ccBox = h('div', 'kkp-cc' + (settings.controlsPos === 'overlay' ? ' kkp-cc-lift' : ''));
    var ccText = h('span', 'kkp-cc-text');
    ccBox.appendChild(ccText);
    ccBox.hidden = true;
    viewport.appendChild(ccBox);
    function textSpan(t) { var sp = h('span'); sp.textContent = t; return sp; }
    var prevBtn = h('button', 'kkp-btn kkp-prev', ICONS.prev);
    prevBtn.appendChild(textSpan(lb('prev')));
    var replayBtn = h('button', 'kkp-ctl kkp-replay', ICONS.replay);
    replayBtn.title = lb('replay');
    replayBtn.setAttribute('aria-label', lb('replay'));
    var title = h('div', 'kkp-title kkp-float');
    var progress = h('div', 'kkp-progress', '<i></i>');
    var count = h('div', 'kkp-count');
    var nextBtn = h('button', 'kkp-btn primary kkp-next');
    nextBtn.appendChild(textSpan(lb('next')));
    nextBtn.insertAdjacentHTML('beforeend', ICONS.next);
    prevBtn.type = nextBtn.type = replayBtn.type = 'button';
    /*
     * Yerleşim (0.18): alt gezinme çubuğu yok. Sol üstte (slaydın üstünde yüzer) menü düğmesi ve slayt başlığı;
     * slayt sayacı ve ilerleme menünün içinde, kurs adının altında; Önceki/Sonraki ve baştan oynat denetim çubuğunda
     * (Önceki/Sonraki ses düğmesinin yanında). Menü kapalıysa sayaç ve ilerleme de denetim çubuğunda.
     */
    var menuBtn = null, menu = null;
    if (settings.menu) {
      menuBtn = h('button', 'kkp-btn kkp-menu-btn kkp-float', ICONS.menu);
      menuBtn.type = 'button';
      menuBtn.appendChild(textSpan(lb('menu')));
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.title = lb('menu');
    }
    // 0.38: podcast modu (LMS çıktısında "Podcast özellikli çıktı" seçiliyse ve kursta dinlenecek ses varsa)
    var podTracks = podcastEnabled(course) ? podcastTracks(course, resolveMedia) : [];
    var podBtn = null;
    if (podTracks.length) {
      podBtn = h('button', 'kkp-btn kkp-float kkp-pod-btn', ICONS.headphones);
      podBtn.type = 'button';
      podBtn.appendChild(textSpan(lb('podcast')));
      podBtn.title = lb('podcastListen');
    }
    // 0.39: mikro-öğrenme kartları (LMS çıktısında "Mikro-öğrenme kartları" seçiliyse)
    var cardIdx = cardsEnabled(course) ? cardSlides(course) : [];
    var cardsBtn = null;
    if (cardIdx.length) {
      cardsBtn = h('button', 'kkp-btn kkp-float kkp-cards-btn', ICONS.cards);
      cardsBtn.type = 'button';
      cardsBtn.appendChild(textSpan(lb('cards')));
      cardsBtn.title = lb('cardsOpen');
    }
    var topBar = null;
    if (settings.menu || settings.title || podBtn || cardsBtn) {
      topBar = h('div', 'kkp-top');
      if (menuBtn) topBar.appendChild(menuBtn);
      if (cardsBtn) topBar.appendChild(cardsBtn);
      if (podBtn) topBar.appendChild(podBtn);
      if (settings.title) topBar.appendChild(title);
      viewport.appendChild(topBar);
    }
    wrap.appendChild(viewport);

    /* --- menü: slayt listesi --- */
    function canNext() {
      var q = quizOf(slides[index]);
      if (q && q.requireAnswer !== false && !qState(slides[index]).done) return false; // soru cevaplanmadan ilerlenmez (0.24)
      return !settings.lockNext || !!done[index];
    }
    function canGo(i) {
      if (i === index || visited[i]) return true;
      if (settings.navigation !== 'sequential') return true;
      return i === index + 1 && canNext();
    }
    /*
     * Menü (0.16): kart görünümünde slayt listesi. Slaytta "section" (bölüm başlığı) varsa o slayttan itibaren yeni
     * bölüm başlar; bölümler açılır-kapanır (geçerli slaydın bölümü açık gelir), tüm slaytları görülen bölümde ✓.
     * Her slaytta adı, süresi ve görüldüyse yeşil ✓; sırayla gezinmede gidilemeyen slaytlar kilitli.
     */
    var secOpen = {}; // menü girdisi kimliği -> açık mı (öğrencinin seçimi; yoksa geçerli slaydı içeren açık)
    if (settings.menu) {
      menu = h('nav', 'kkp-menu');
      menu.hidden = true;
      menu.setAttribute('aria-label', lb('menu'));
      var mtop = h('div', 'kkp-menu-top');
      var mh = h('div', 'kkp-menu-head'); mh.textContent = course.title || '';
      var mclose = h('button', 'kkp-ctl kkp-menu-close', ICONS.close);
      mclose.type = 'button';
      mclose.title = lb('close');
      mclose.setAttribute('aria-label', lb('close'));
      mclose.addEventListener('click', function () { toggleMenu(false); menuBtn.focus(); });
      mtop.appendChild(mh); mtop.appendChild(mclose);
      menu.appendChild(mtop);
      if (settings.counter || settings.progress) {
        // kurs adının altında: "3 / 10" ve ilerleme çubuğu
        menu.className += ' kkp-has-stats';
        var stats = h('div', 'kkp-menu-stats');
        if (settings.counter) stats.appendChild(count);
        if (settings.progress) stats.appendChild(progress);
        menu.appendChild(stats);
      }
      menu.appendChild(h('div', 'kkp-menu-list'));
      viewport.appendChild(menu);
      menuBtn.addEventListener('click', function () { toggleMenu(menu.hidden); });
    }
    function toggleMenu(open, noFocus) {
      if (!menu) return;
      menu.hidden = !open;
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        renderMenu();
        if (noFocus) return; // editördeki ayar önizlemesi odağı çalmasın
        var cur = menu.querySelector('[aria-current]') || menu.querySelector('.kkp-menu-item:not(:disabled)') || menu.querySelector('.kkp-sec-head');
        if (cur) cur.focus();
      }
    }
    /*
     * Menü ağacı (0.29): menuEntries(course) düz listesinden (gizlenenler hariç) iç içe düğümler { e, i (slayt dizini,
     * başlıkta -1), kids }. Gizli bir girdinin altındakiler, ondan önceki ilk daha üst seviyeli girdiye bağlanır.
     */
    function menuTree() {
      var at = {}, roots = [], stack = [];
      slides.forEach(function (sl, i) { at[sl.id] = i; });
      menuEntries(course).forEach(function (e) {
        if (e.hidden) return;
        var n = { e: e, i: e.slideId ? at[e.slideId] : -1, kids: [] };
        while (stack.length && stack[stack.length - 1].e.level >= e.level) stack.pop();
        if (stack.length) stack[stack.length - 1].kids.push(n); else roots.push(n);
        stack.push(n);
      });
      return roots;
    }
    /** Düğümün (kendisi + altındakiler) slayt dizinleri */
    function nodeSlides(n, out) {
      out = out || [];
      if (n.i >= 0) out.push(n.i);
      n.kids.forEach(function (c) { nodeSlides(c, out); });
      return out;
    }
    function nodeOpen(n) {
      if (secOpen.hasOwnProperty(n.e.id)) return secOpen[n.e.id];
      var all = nodeSlides(n);
      for (var j = 0; j < all.length; j++) if (all[j] === index && (n.i !== index || n.kids.length)) return true;
      return false;
    }
    function toggleNode(n, sel) {
      secOpen[n.e.id] = !nodeOpen(n);
      renderMenu();
      var b = menu.querySelector(sel + '[data-node="' + n.e.id + '"]');
      if (b) b.focus();
    }
    function fmtDur(sec) {
      sec = Math.max(0, Math.round(sec));
      var m = Math.floor(sec / 60), x = sec % 60;
      return (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x;
    }
    function menuItem(n) {
      var i = n.i, s = slides[i];
      var b = h('button', 'kkp-menu-item');
      b.type = 'button';
      b.setAttribute('data-index', String(i));
      var tx = h('span', 'kkp-mi-text');
      var nm = h('span', 'kkp-menu-name'); nm.textContent = n.e.title || s.name || ('' + (i + 1));
      var du = h('span', 'kkp-menu-dur', ICONS.playCircle);
      du.appendChild(document.createTextNode(fmtDur(slideDuration(s))));
      tx.appendChild(nm); tx.appendChild(du);
      b.appendChild(tx);
      b.disabled = !started || !canGo(i);
      if (i === index) b.setAttribute('aria-current', 'step');
      else if (visited[i]) { var ck = h('span', 'kkp-menu-seen', ICONS.check); ck.setAttribute('aria-label', '(görüldü)'); b.appendChild(ck); }
      else if (b.disabled && started) { var lk = h('span', 'kkp-menu-lock', ICONS.lock); lk.setAttribute('aria-hidden', 'true'); b.appendChild(lk); }
      b.addEventListener('click', function () { toggleMenu(false); go(i); if (menuBtn) menuBtn.focus(); });
      return b;
    }
    /** İç içe düğümler: yaprak slayt = düğme; alt başlıklı düğüm = [+/−] + (slayt düğmesi ya da başlık) + girintili liste */
    function menuNodes(parent, nodes) {
      nodes.forEach(function (n) {
        if (!n.kids.length) {
          if (n.i >= 0) parent.appendChild(menuItem(n));
          else { var hd = h('div', 'kkp-menu-heading'); hd.textContent = n.e.title; parent.appendChild(hd); }
          return;
        }
        var open = nodeOpen(n);
        var box = h('div', 'kkp-sub');
        var row = h('div', 'kkp-sub-row');
        var tg = h('button', 'kkp-sub-toggle', open ? ICONS.minus : ICONS.plus);
        tg.type = 'button';
        tg.setAttribute('data-node', n.e.id);
        tg.setAttribute('aria-expanded', open ? 'true' : 'false');
        tg.setAttribute('aria-label', (n.e.title || (slides[n.i] && slides[n.i].name) || '') + (open ? ' (kapat)' : ' (aç)'));
        tg.addEventListener('click', function () { toggleNode(n, '.kkp-sub-toggle'); });
        if (n.i >= 0) row.appendChild(menuItem(n));
        else {
          var sh = h('button', 'kkp-sub-head');
          sh.type = 'button';
          sh.setAttribute('data-node', n.e.id);
          sh.setAttribute('aria-expanded', open ? 'true' : 'false');
          sh.textContent = n.e.title;
          sh.addEventListener('click', function () { toggleNode(n, '.kkp-sub-head'); });
          row.appendChild(sh);
        }
        row.appendChild(tg); // bölüm kartlarındaki gibi sağda
        box.appendChild(row);
        var kids = h('div', 'kkp-sub-items');
        kids.hidden = !open;
        menuNodes(kids, n.kids);
        box.appendChild(kids);
        parent.appendChild(box);
      });
    }
    /** En üst seviyedeki başlık: kart görünümünde bölüm ("Bölüm 2 · Uygulama"), açılır-kapanır */
    function menuSection(n, k) {
      var open = nodeOpen(n), all = nodeSlides(n);
      var allSeen = all.length > 0 && all.every(function (i) { return visited[i]; });
      var box = h('section', 'kkp-sec');
      var head = h('button', 'kkp-sec-head');
      head.type = 'button';
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      head.setAttribute('data-node', n.e.id);
      head.setAttribute('data-sec', String(all.length ? all[0] : -1)); // bölümün ilk slaydı (0.16'dan beri)
      var tx = h('span', 'kkp-sec-text');
      var no = h('span', 'kkp-sec-no', allSeen ? '<span class="kkp-sec-done">' + ICONS.check + '</span>' : '');
      no.appendChild(document.createTextNode(lb('section') + ' ' + k));
      var tt = h('span', 'kkp-sec-title'); tt.textContent = n.e.title;
      tx.appendChild(no); tx.appendChild(tt);
      head.appendChild(tx);
      head.appendChild(h('span', 'kkp-sec-toggle', open ? ICONS.minus : ICONS.plus));
      var items = h('div', 'kkp-sec-items');
      items.hidden = !open;
      menuNodes(items, n.kids);
      head.addEventListener('click', function () { toggleNode(n, '.kkp-sec-head'); });
      box.appendChild(head);
      box.appendChild(items);
      return box;
    }
    function renderMenu() {
      if (!menu || menu.hidden) return;
      var list = menu.querySelector('.kkp-menu-list');
      var keep = list.scrollTop;
      list.innerHTML = '';
      var roots = menuTree(), k = 0, flat = null;
      roots.forEach(function (n) {
        if (n.i < 0) { flat = null; list.appendChild(menuSection(n, ++k)); return; }
        if (!flat) { flat = h('div', 'kkp-menu-flat'); list.appendChild(flat); }
        menuNodes(flat, [n]);
      });
      list.scrollTop = keep;
    }

    function updateNav() {
      prevBtn.disabled = index === 0;
      var locked = !canNext();
      nextBtn.disabled = index >= slides.length - 1 || locked;
      nextBtn.title = locked && index < slides.length - 1 ? (quizOf(slides[index]) && !qState(slides[index]).done ? lb('quizLocked') : lb('lockedNext')) : '';
      renderMenu();
      if (cards && cards.open) cardsUpdate(); // 0.39
    }

    // süre çubuğu: [oynat/duraklat] [—— ilerleme ——] [0:03 / 0:10]
    /*
     * Denetim çubuğu (0.16): [10 sn geri] [oynat/duraklat] [10 sn ileri] geçen ──süre çubuğu── -kalan [ses] [⚙ hız] [tam ekran]
     * Her parça ayarla açılır/kapanır; hiçbiri yoksa çubuk yok. "overlay": slaydın üstünde, oynarken fare durunca gizlenir.
     */
    var seek = null;
    var canFs = !opts.noKeys && !!(root.requestFullscreen || root.webkitRequestFullscreen) &&
      (document.fullscreenEnabled !== false && document.webkitFullscreenEnabled !== false);
    var useFs = settings.fullscreen && canFs;
    var statsInRow = !settings.menu && (settings.counter || settings.progress);
    // 0.22: kursta altyazılı video/ses var mı (yoksa CC düğmesi gösterilmez)
    var hasCaptions = slides.some(function (sl) {
      function any(list) { return (list || []).some(function (e) { return e.captions && e.captions.length; }); }
      return any(sl.elements) || (sl.layers || []).some(function (l) { return any(l.elements); });
    });
    if (settings.playPause || settings.skip || settings.seekbar || settings.time || settings.volume || settings.speed || useFs ||
        settings.prevNext || settings.replay || statsInRow) {
      var ctlBtn = function (cls, icon, label) {
        var b = h('button', 'kkp-ctl ' + cls, icon);
        b.type = 'button';
        if (label) { b.title = label; b.setAttribute('aria-label', label); }
        seek.row.appendChild(b);
        return b;
      };
      seek = { row: h('div', 'kkp-seek' + (settings.controlsPos === 'overlay' ? ' kkp-over' : '')), state: '', dragging: false,
        btn: null, back: null, fwd: null, track: null, fill: null, knob: null, time: null, remain: null, vol: null, fs: null };
      if (settings.skip) seek.back = ctlBtn('kkp-skip-back', ICONS.back10, lb('skipBack'));
      if (settings.playPause) seek.btn = ctlBtn('kkp-seek-btn', '', '');
      if (settings.skip) seek.fwd = ctlBtn('kkp-skip-fwd', ICONS.fwd10, lb('skipForward'));
      if (settings.replay) seek.row.appendChild(replayBtn);
      if (settings.time) { seek.time = h('div', 'kkp-seek-time'); seek.time.setAttribute('aria-hidden', 'true'); seek.row.appendChild(seek.time); }
      if (settings.seekbar) {
        seek.track = h('div', 'kkp-seek-track');
        seek.fill = h('i', 'kkp-seek-fill');
        seek.knob = h('i', 'kkp-seek-knob');
        seek.track.tabIndex = 0;
        seek.track.setAttribute('role', 'slider');
        seek.track.setAttribute('aria-label', 'Slaydın zaman çizelgesi');
        seek.track.setAttribute('aria-valuemin', '0');
        seek.track.appendChild(seek.fill);
        seek.track.appendChild(seek.knob);
        seek.row.appendChild(seek.track);
      } else seek.row.appendChild(h('div', 'kkp-seek-spacer'));
      if (settings.time) { seek.remain = h('div', 'kkp-seek-remain'); seek.remain.setAttribute('aria-hidden', 'true'); seek.row.appendChild(seek.remain); }
      if (settings.seekbar || settings.time) seek.row.appendChild(h('span', 'kkp-seek-break')); // 0.38.2: dar ekranda satır sonu
      if (statsInRow) {
        if (settings.counter) seek.row.appendChild(count);
        if (settings.progress) seek.row.appendChild(progress);
      }
      if (settings.volume) seek.vol = ctlBtn('kkp-vol', '', '');
      if (hasCaptions && settings.captions) seek.cc = ctlBtn('kkp-cc-btn', ICONS.cc, ''); // altyazılar (0.22)
      if (settings.prevNext) { // ses düğmesinin yanında, yan yana
        var navGroup = h('div', 'kkp-nav');
        navGroup.appendChild(prevBtn);
        navGroup.appendChild(nextBtn);
        seek.row.appendChild(navGroup);
      }
      seek.speedSlot = h('span', 'kkp-speed-slot');
      seek.speedSlot.style.display = 'contents';
      seek.row.appendChild(seek.speedSlot);
      if (useFs) seek.fs = ctlBtn('kkp-fs', '', '');
      if (settings.controlsPos === 'overlay') viewport.appendChild(seek.row); else wrap.appendChild(seek.row);
    }
    /* oynatma hızı: süre çubuğu varsa onun sağında, yoksa alt çubukta */
    var speed = null;
    if (settings.speed) {
      speed = { box: h('div', 'kkp-speed'), btn: h('button', 'kkp-speed-btn'), menu: h('ul', 'kkp-speed-menu') };
      speed.btn.type = 'button';
      speed.btn.setAttribute('aria-haspopup', 'menu');
      speed.btn.setAttribute('aria-expanded', 'false');
      speed.menu.setAttribute('role', 'menu');
      speed.menu.setAttribute('aria-label', lb('speed'));
      speed.menu.hidden = true;
      var shd = h('li', 'kkp-speed-head');
      shd.setAttribute('role', 'presentation');
      shd.textContent = lb('speed');
      speed.menu.appendChild(shd);
      SPEEDS.forEach(function (r) {
        var li = h('li');
        li.setAttribute('role', 'presentation');
        var b = h('button', 'kkp-speed-item');
        b.type = 'button';
        b.setAttribute('role', 'menuitemradio');
        b.setAttribute('data-rate', String(r));
        b.textContent = r === 1 ? lb('speedNormal') + ' (1×)' : speedText(r);
        b.addEventListener('click', function () { setRate(r); toggleSpeed(false); speed.btn.focus(); });
        li.appendChild(b);
        speed.menu.appendChild(li);
      });
      speed.box.appendChild(speed.menu);
      speed.box.appendChild(speed.btn);
      speed.btn.addEventListener('click', function () { toggleSpeed(speed.menu.hidden); });
      speed.box.addEventListener('keydown', function (ev) {
        if (speed.menu.hidden) return;
        var items = speed.menu.querySelectorAll('.kkp-speed-item');
        var i = Array.prototype.indexOf.call(items, document.activeElement);
        if (ev.key === 'Escape') { toggleSpeed(false); speed.btn.focus(); }
        else if (ev.key === 'ArrowDown') items[(i + 1) % items.length].focus();
        else if (ev.key === 'ArrowUp') items[(i - 1 + items.length) % items.length].focus();
        else if (ev.key === 'Home') items[0].focus();
        else if (ev.key === 'End') items[items.length - 1].focus();
        else if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight' && ev.key !== 'PageUp' && ev.key !== 'PageDown') return;
        ev.preventDefault();
        ev.stopPropagation(); // slayt gezinme kısayolları çalışmasın
      });
      // dışarı tıklayınca kapanır
      wrap.addEventListener('pointerdown', function (ev) {
        if (!speed.menu.hidden && !speed.box.contains(ev.target)) toggleSpeed(false);
      });
      speed.btn.className = 'kkp-ctl kkp-speed-btn';
      seek.speedSlot.appendChild(speed.box);
    }
    function toggleSpeed(open) {
      if (!speed) return;
      speed.menu.hidden = !open;
      speed.btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        var cur = speed.menu.querySelector('[aria-checked=true]');
        if (cur) cur.focus();
      }
    }
    function updateSpeedUi() {
      if (!speed) return;
      speed.btn.innerHTML = ICONS.gear + '<span class="kkp-speed-val">' + (rate === 1 ? '' : speedText(rate)) + '</span>';
      speed.btn.title = lb('speed') + ': ' + speedText(rate);
      speed.btn.setAttribute('aria-label', lb('speed') + ': ' + speedText(rate));
      speed.btn.classList.toggle('kkp-changed', rate !== 1);
      var items = speed.menu.querySelectorAll('.kkp-speed-item');
      for (var i = 0; i < items.length; i++) items[i].setAttribute('aria-checked', +items[i].getAttribute('data-rate') === rate ? 'true' : 'false');
    }
    updateSpeedUi();

    root.appendChild(wrap);

    if (opts.onClose) {
      var closeBtn = h('button', 'kkp-btn kkp-close', 'Önizlemeyi kapat ✕');
      closeBtn.type = 'button';
      closeBtn.addEventListener('click', opts.onClose);
      wrap.appendChild(closeBtn);
    }

    /*
     * 0.38.2: denetim çubuğunun yerleşimi. Tek satıra sığmıyorsa (ya da oynatıcı 600 px'den darsa) .kkp-narrow: iki satır.
     * Düğme satırı yine de taşıyorsa ya da 370 px'den darsa .kkp-tiny: düğmeler küçülür. Hep aynı genişlikte aynı sonucu verir
     * (ResizeObserver döngüye girmez).
     */
    function layoutBar() {
      var w = wrap.clientWidth;
      wrap.classList.remove('kkp-narrow', 'kkp-tiny');
      if (!w || !seek) return;
      if (w >= 600 && seek.row.scrollWidth <= seek.row.clientWidth + 1) return;
      wrap.classList.add('kkp-narrow');
      if (w < 370 || barRows() > 1) wrap.classList.add('kkp-tiny');
    }
    /** Süre çubuğu satırı dışındaki düğme satırlarının sayısı */
    function barRows() {
      var bs = seek.row.querySelectorAll('.kkp-ctl, .kkp-nav .kkp-btn'), rows = {}, n = 0;
      for (var i = 0; i < bs.length; i++) {
        var r = bs[i].getBoundingClientRect();
        if (!r.width) continue;
        var k = Math.round((r.top + r.height / 2) / 4);
        if (!rows[k]) { rows[k] = true; n++; }
      }
      return n;
    }
    function fit() {
      layoutBar();
      var vw = viewport.clientWidth, vh = viewport.clientHeight;
      var pad = vw > 700 ? 24 : 0;
      var s = Math.min((vw - pad * 2) / course.width, (vh - pad * 2) / course.height);
      if (!(s > 0)) s = 1;
      stage.style.transform = 'scale(' + s + ')';
      stage.style.left = Math.round((vw - course.width * s) / 2) + 'px';
      stage.style.top = Math.round((vh - course.height * s) / 2) + 'px';
    }

    /*
     * --- slayt saatleri ---
     * Ana katmanın ve her slayt katmanının kendi saati vardır. Katmanın saati katman her
     * gösterildiğinde sıfırdan başlar. Bir öğe, saati start <= t < end aralığındayken ve
     * tetikleyicilerle gizlenmemişken görünür.
     */
    var raf = 0;
    var base = null;   // ana katman saati
    var layers = [];   // { def, node, visible, clock }
    var byId = {};     // öğe kimliği -> öğe kaydı (ana katman + tüm katmanlar)
    var gen = 0;       // her slayt çiziminde artar; eski tetikleyicileri ayırt etmek için

    function now() { return global.performance.now(); }
    /** owner: slayt ya da katman tanımı (zaman çizelgesi tetikleyicileri onun triggers listesinde) */
    function newClock(items, owner) {
      items.forEach(prepMedia);
      return { items: items, owner: owner || {}, t0: now(), paused: false, pausedT: 0, lastT: -1 };
    }
    /*
     * Oynatma hızı: tüm saatler (ana katman + katmanlar) rate katıyla ilerler, video/ses playbackRate = rate.
     * Saat zamanı "içerik zamanı"dır (zaman çizelgesindeki saniye); süre çubuğu ve tetikleyiciler değişmez.
     * Bir saati t anına kurmak için t0 = n - t * 1000 / rate (setClockT).
     */
    function clockTime(c, n) { return c.paused ? c.pausedT : (n - c.t0) / 1000 * rate; }
    function setClockT(c, t, n) { c.t0 = n - t * 1000 / rate; }
    function eachClock(fn) {
      if (base) fn(base);
      for (var i = 0; i < layers.length; i++) fn(layers[i].clock);
    }
    function setRate(r) {
      r = +r;
      if (SPEEDS.indexOf(r) < 0 || r === rate) return;
      var n = now();
      var ts = [];
      eachClock(function (c) { ts.push(clockTime(c, n)); });
      rate = r;
      var k = 0;
      eachClock(function (c) { var t = ts[k++]; if (!c.paused) setClockT(c, t, n); });
      allItems().forEach(function (it) {
        if (it.media) applyRate(it.media);
        // oynayan efekt yeni hızla, kaldığı yerden sürsün
        if (it.fx && it.clock) syncFx(it, clockTime(it.clock, n), slideDuration(it.clock.owner), true);
      });
      updateSpeedUi();
    }
    function applyRate(m) {
      try { m.defaultPlaybackRate = rate; m.playbackRate = rate; } catch (e) {}
    }

    function playMedia(m) {
      if (opts.silent) return; // editördeki küçük ayar önizlemesi: ses/video çalmaz
      applyRate(m);
      applyMute(m);
      var p = m.play();
      if (p && p.catch) p.catch(function (err) {
        // tarayıcı/LMS çerçevesi kendiliğinden oynatmayı engelledi: videonun üstünde "▶ Oynatmak için tıklayın"
        if (err && err.name === 'NotAllowedError') mediaBlocked(m);
      });
    }

    /*
     * Video/ses hazırlığı (0.18.1):
     *  - zaman çizelgesiyle oynayan (otomatik) video oynatıcının denetim çubuğuyla yönetilir; çubukta oynat/duraklat ya
     *    da süre çubuğu varsa videonun kendi denetimleri gizlenir (ayrı duraklatılıp zamandan kopmasın, çubuklar üst üste
     *    binmesin). Tıklayınca oynayan video kendi denetimlerini korur.
     *  - oynatılamayan dosyada (biçim desteklenmiyor vb.) videonun üstünde açıklama gösterilir
     */
    function prepMedia(it) {
      var m = it.media;
      if (!m || m.getAttribute('data-kk-prep')) return;
      m.setAttribute('data-kk-prep', '1');
      if (it.e.type === 'video' && it.autoplay && (settings.playPause || settings.seekbar)) m.controls = false;
      if (it.e.captions && it.e.captions.length) {
        ['timeupdate', 'seeked', 'play', 'pause', 'ended'].forEach(function (t) { m.addEventListener(t, updateCaptions); });
      }
      m.addEventListener('error', function () {
        if (it.e.type !== 'video' || it.wrap.querySelector('.kkp-media-msg')) return;
        var msg = h('div', 'kkp-media-msg');
        msg.setAttribute('role', 'alert');
        msg.textContent = lb('mediaError');
        it.wrap.appendChild(msg);
      });
    }
    function mediaBlocked(m) {
      var items = allItems(), it = null;
      for (var i = 0; i < items.length; i++) if (items[i].media === m) { it = items[i]; break; }
      if (!it || it.e.type !== 'video' || it.wrap.querySelector('.kkp-tap')) return;
      var b = h('button', 'kkp-tap', ICONS.play);
      b.type = 'button';
      b.setAttribute('aria-label', lb('tapToPlay'));
      b.appendChild(textSpan(lb('tapToPlay')));
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        b.remove();
        if (userPaused) { togglePlay(); return; } // çubuk duraklıysa slaydı (ve videoyu) sürdür
        var p = m.play();
        if (p && p.catch) p.catch(function () {});
      });
      it.wrap.appendChild(b);
    }

    /** quiet: otomatik oynatmayı başlatma (duraklatılmışken sarma) */
    function showItem(it, on, quiet) {
      it.shown = on;
      if (on) {
        it.wrap.style.visibility = 'visible';
        // tetikleyiciyle gösterilince de giriş efekti baştan oynar (zamanındaki efekt runClock/seek'te ayarlanır)
        if (FX_IN[it.e.effect]) setFx(it, { kind: 'in', since: 0, def: FX_IN[it.e.effect], dur: fxDur(it.e, 'in') });
        if (it.media && it.autoplay && !quiet) {
          try { it.media.currentTime = 0; } catch (e) {}
          playMedia(it.media);
        }
      } else {
        it.wrap.style.visibility = 'hidden';
        clearFx(it);
        if (it.media) { try { it.media.pause(); } catch (e) {} }
        if (it.e.captions) updateCaptions();
      }
    }

    /** Efekt animasyonunu öğeye uygular (saat duraklıysa o karede durur) */
    function setFx(it, ph) {
      it.wrap.style.animation = 'none';
      void it.wrap.offsetWidth; // animasyonu baştan kur
      it.wrap.style.animation = fxAnimation(ph, rate);
      it.wrap.style.animationPlayState = it.clock && it.clock.paused ? 'paused' : '';
      it.fx = ph.kind;
    }
    function clearFx(it) {
      if (!it.fx) return;
      it.wrap.style.animation = '';
      it.fx = null;
    }
    /** Zamanla gelen efekt: çıkış başlayınca uygula; sarınca o anın efektine (ya da hiçbirine) getir */
    function syncFx(it, t, dur, seeking) {
      if (!it.shown) return;
      var ph = fxPhase(it.e, t, dur);
      if (ph && ph.kind === 'out') { if (it.fx !== 'out' || seeking) setFx(it, ph); }
      else if (seeking) { if (ph) setFx(it, ph); else clearFx(it); }
      else if (it.fx === 'out') clearFx(it);
    }

    /** Bir saatin öğelerini günceller; ileride değişecek öğe varsa true döner */
    function runClock(c, n) {
      var t = clockTime(c, n), pending = false;
      var dur = slideDuration(c.owner);
      for (var i = 0; i < c.items.length; i++) {
        var it = c.items[i];
        it.clock = c;
        var st = +it.e.start || 0;
        var en = itemEnd(it.e, dur);
        var vis = t >= st && t < en && !it.hidden;
        if (vis !== it.shown) showItem(it, vis);
        syncFx(it, t, dur, false);
        if (!c.paused && (t < st || (en !== Infinity && t < en))) pending = true;
      }
      return pending;
    }

    /* --- zaman çizelgesi tetikleyicileri (slayt ve katman): başlayınca / bitince / saniyeye gelince --- */

    var fireDepth = 0; // katmanlar birbirini açarsa sonsuz döngüye girmesin

    function timelineTriggers(c) { return (c.owner && c.owner.triggers) || []; }

    /** Saatin sahibine ait belirli bir olayın tetikleyicilerini çalıştırır; slayt değişirse false */
    function fireEvent(c, name) {
      var list = timelineTriggers(c), g = gen;
      if (!list.length || fireDepth > 20) return true;
      fireDepth++;
      try {
        for (var i = 0; i < list.length; i++) {
          if (list[i].on !== name) continue;
          runAction(list[i]);
          if (g !== gen) return false;
        }
      } finally { fireDepth--; }
      return true;
    }

    /**
     * Oynatma sırasında geçilen anları tetikler (önceki kareden bu kareye: lastT < an <= t).
     * Sarma (seekTo) lastT'yi değiştirdiği için atlanan anlar tetiklenmez.
     * Dönüş: { ok: slayt değişmediyse true, pending: ileride tetiklenecek olay varsa true }
     */
    function fireTimeline(c, n) {
      var list = timelineTriggers(c);
      var t = clockTime(c, n), prev = c.lastT;
      c.lastT = t;
      if (!list.length || c.paused) return { ok: true, pending: false };
      var dur = slideDuration(c.owner), g = gen, pending = false;
      for (var i = 0; i < list.length; i++) {
        var tr = list[i], at;
        if (tr.on === 'timelineAt') at = Math.max(0, +tr.at || 0);
        else if (tr.on === 'timelineEnd') at = dur;
        else continue;
        if (prev < at && t >= at) {
          fireDepth++;
          try { runAction(tr); } finally { fireDepth--; }
          if (g !== gen) return { ok: false, pending: false };
        } else if (t < at) pending = true;
      }
      return { ok: true, pending: pending };
    }

    function tick() {
      raf = 0;
      if (!base) return;
      var n = now(), r, i;
      var pending = false;
      // önce zaman olayları (görünürlüğü, katmanları, değişkenleri değiştirebilir), sonra öğeler
      r = fireTimeline(base, n);
      if (!r.ok) return;
      if (r.pending) pending = true;
      for (i = 0; i < layers.length; i++) {
        if (!layers[i].visible) continue;
        r = fireTimeline(layers[i].clock, n);
        if (!r.ok) return;
        if (r.pending) pending = true;
      }
      if (runClock(base, n)) pending = true;
      for (i = 0; i < layers.length; i++) {
        if (layers[i].visible && runClock(layers[i].clock, n)) pending = true;
      }
      var s = slides[index];
      if (s && started) {
        var bt = clockTime(base, n);
        if (bt > reachedT) reachedT = bt;
        if (!done[index]) {
          if (bt >= slideDuration(s) - 0.01) { done[index] = true; updateNav(); }
          else if (settings.lockNext && !base.paused) pending = true;
        }
      }
      if (s && s.autoNext && index < slides.length - 1 && !base.paused) {
        if (clockTime(base, n) >= slideDuration(s)) { go(index + 1); return; }
        pending = true;
      }
      // süre çubuğu, slaydın sonuna kadar her karede ilerler
      if (seek && s && !base.paused && clockTime(base, n) < slideDuration(s)) pending = true;
      if (cards && cards.open && s && !base.paused && clockTime(base, n) < slideDuration(s)) pending = true; // 0.39: kart ilerleme çizgisi
      updateSeek(n);
      updateCaptions();
      if (cards && cards.open) cardsProgress(n);
      if (pending) raf = global.requestAnimationFrame(tick);
    }

    function startClock() {
      stopClock();
      if (!base) return;
      base.t0 = now();
      base.lastT = -1;
      if (!fireEvent(base, 'timelineStart')) return; // "başlayınca" tetikleyicisi slaydı değiştirdiyse
      tick();
    }

    function stopClock() {
      if (raf) global.cancelAnimationFrame(raf);
      raf = 0;
    }

    /** Tetikleyiciden sonra görünümü hemen günceller */
    function kick() {
      if (!started) return;
      stopClock();
      tick();
    }

    function allItems() {
      var a = base ? base.items.slice() : [];
      for (var i = 0; i < layers.length; i++) a = a.concat(layers[i].clock.items);
      return a;
    }

    function stopMedia() {
      stopClock();
      allItems().forEach(function (it) { if (it.media) { try { it.media.pause(); } catch (e) {} } });
      base = null;
      layers = [];
      byId = {};
      updateCaptions();
    }

    /* --- duraklatma: saat durur, oynayan medya duraklatılır ve devam edince sürdürülür --- */

    var userPaused = false; // süre çubuğundaki oynat/duraklat düğmesi

    function setClockPaused(c, on) {
      if (!c || c.paused === on) return;
      var n = now();
      if (on) {
        c.pausedT = clockTime(c, n);
        c.paused = true;
        c.items.forEach(function (it) {
          if (it.fx) it.wrap.style.animationPlayState = 'paused'; // efekt o karede durur
          it.resume = !!(it.media && !it.media.paused);
          if (it.resume) { try { it.media.pause(); } catch (e) {} }
        });
      } else {
        setClockT(c, c.pausedT, n);
        c.paused = false;
        c.items.forEach(function (it) {
          if (it.fx) it.wrap.style.animationPlayState = '';
          if (it.resume && it.shown) playMedia(it.media);
          it.resume = false;
        });
      }
    }

    /* --- süre çubuğu --- */

    function slideDur() { var s = slides[index]; return s ? slideDuration(s) : 0; }
    function baseTime(n) { return base ? Math.max(0, clockTime(base, n == null ? now() : n)) : 0; }
    function atEnd() { return started && base && baseTime() >= slideDur() - 0.01; }

    function updateSeek(n) {
      if (!seek) return;
      var dur = slideDur();
      var t = started && base ? Math.min(baseTime(n), dur) : 0;
      var f = dur > 0 ? t / dur : 0;
      if (seek.track) {
        seek.fill.style.width = (f * 100) + '%';
        seek.knob.style.left = (f * 100) + '%';
        seek.track.setAttribute('aria-valuemax', String(Math.round(dur * 10) / 10));
        seek.track.setAttribute('aria-valuenow', String(Math.round(t * 10) / 10));
        seek.track.setAttribute('aria-valuetext', fmtTime(t) + ' / ' + fmtTime(dur));
      }
      if (seek.time) {
        seek.time.textContent = fmtTime(t);
        seek.remain.textContent = '-' + fmtTime(Math.max(0, Math.ceil(dur - 0.001) - Math.floor(t + 0.001)));
      }
      var state = !started || userPaused ? 'play' : (t >= dur - 0.01 ? 'replay' : 'pause');
      if (state !== seek.state) {
        seek.state = state;
        if (seek.btn) {
          seek.btn.innerHTML = ICONS[state];
          var label = { play: lb('play'), pause: lb('pause'), replay: lb('replay') }[state];
          seek.btn.title = label;
          seek.btn.setAttribute('aria-label', label);
        }
        wakeControls();
      }
    }

    /* --- altyazılar (0.22) ---
     * Görünen ve oynayan (ya da duraklatılmış ama başlamış) altyazılı medyalardan en öndekinin o anki altyazısı
     * gösterilir. Güncelleme: medyanın timeupdate/seeked/play/pause olayları (prepMedia) + saat her karede (tick).
     */
    var ccOn = !!settings.captionsOn;
    var ccCurrent = null;
    function updateCaptions() {
      var cue = null;
      if (ccOn && started) {
        var items = allItems();
        for (var i = items.length - 1; i >= 0 && !cue; i--) {
          var it = items[i];
          if (!it.media || !it.shown || !it.e.captions || !it.e.captions.length) continue;
          if (it.media.paused && !(it.media.currentTime > 0)) continue;
          if (it.media.ended) continue;
          cue = captionAt(it.e.captions, it.media.currentTime);
        }
      }
      if (cue === ccCurrent) return;
      ccCurrent = cue;
      ccText.textContent = cue ? cue.text : '';
      ccBox.hidden = !cue;
    }
    function setCaptions(on) {
      ccOn = !!on;
      updateCaptions();
      updateCcUi();
    }
    function updateCcUi() {
      if (!seek || !seek.cc) return;
      var l = ccOn ? lb('ccOff') : lb('ccOn');
      seek.cc.title = l;
      seek.cc.setAttribute('aria-label', l);
      seek.cc.setAttribute('aria-pressed', ccOn ? 'true' : 'false');
    }

    /* --- ses aç/kapat (tüm video ve sesler; öğenin kendi "sessiz" ayarı korunur) --- */
    var muted = false;
    function applyMute(m) { m.muted = muted || m.getAttribute('data-kk-muted') === '1'; }
    function setMuted(on) {
      muted = !!on;
      allItems().forEach(function (it) { if (it.media) applyMute(it.media); });
      updateVolUi();
    }
    function updateVolUi() {
      if (!seek || !seek.vol) return;
      seek.vol.innerHTML = muted ? ICONS.volOff : ICONS.vol;
      var l = muted ? lb('unmute') : lb('mute');
      seek.vol.title = l;
      seek.vol.setAttribute('aria-label', l);
      seek.vol.setAttribute('aria-pressed', muted ? 'true' : 'false');
    }

    /* --- tam ekran (oynatıcının kapsayıcısı) --- */
    function fsElement() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
    function toggleFullscreen() {
      try {
        if (fsElement()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        else {
          var r = (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
          if (r && r.catch) r.catch(function () {});
        }
      } catch (e) {}
    }
    function updateFsUi() {
      if (!seek || !seek.fs) return;
      var on = fsElement() === root;
      seek.fs.innerHTML = on ? ICONS.fsExit : ICONS.fs;
      var l = on ? lb('exitFullscreen') : lb('fullscreen');
      seek.fs.title = l;
      seek.fs.setAttribute('aria-label', l);
      wrap.classList.toggle('kkp-full', on);
    }

    /* --- slaydın üstündeki denetimler: oynarken fare/klavye 2,5 sn durunca gizlenir --- */
    var idleTimer = 0;
    /** Klavyeyle odaklanılmış bir denetim var mı (fareyle tıklanan düğmede kalan odak gizlenmeyi engellemesin) */
    function kbFocusIn(el) {
      try { return !!el.querySelector(':focus-visible'); } catch (e) { return el.contains(document.activeElement); }
    }
    function wakeControls() {
      if (!seek || settings.controlsPos !== 'overlay') return;
      wrap.classList.remove('kkp-idle');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () {
        var busy = !started || userPaused || atEnd() || kbFocusIn(seek.row) ||
          (speed && !speed.menu.hidden) || (menu && !menu.hidden) || seek.dragging;
        if (busy) wakeControls(); else wrap.classList.add('kkp-idle');
      }, 2500);
    }

    function togglePlay() {
      if (!started || !base) return;
      if (atEnd()) {
        // "Baştan oynat": slayt yeniden başlıyormuş gibi "başlayınca" tetikleyicileri de çalışır
        userPaused = false; seekTo(0); syncPause();
        base.lastT = -1;
        if (fireEvent(base, 'timelineStart')) kick();
        return;
      }
      userPaused = !userPaused;
      syncPause();
      kick();
    }

    /** Ana katmanın saatini t saniyesine sarar; öğeler ve otomatik oynayan medya bu ana göre ayarlanır */
    function seekTo(t) {
      if (!started || !base) return;
      var dur = slideDur();
      t = Math.max(0, Math.min(+t || 0, dur));
      if (settings.lockNext && !done[index]) t = Math.min(t, reachedT); // izlenmemiş kısma atlanamaz
      var n = now();
      if (base.paused) base.pausedT = t; else setClockT(base, t, n);
      base.lastT = t; // sarmayla atlanan anlardaki tetikleyiciler çalışmaz
      base.items.forEach(function (it) {
        var st = +it.e.start || 0;
        var en = itemEnd(it.e, dur);
        var vis = t >= st && t < en && !it.hidden;
        if (vis !== it.shown) showItem(it, vis, true);
        it.clock = base;
        syncFx(it, t, dur, true);
        if (!it.media || !it.autoplay) return;
        it.resume = false;
        if (!vis) return;
        var m = it.media, mt = t - st;
        var over = !m.loop && isFinite(m.duration) && m.duration > 0 && mt >= m.duration;
        try { m.currentTime = over ? m.duration : mt; } catch (e) {}
        if (base.paused) { try { m.pause(); } catch (e) {} it.resume = !over; }
        else if (!over && m.paused) playMedia(m);
      });
      updateSeek(n);
      kick();
    }

    function seekFromPointer(ev) {
      var r = seek.track.getBoundingClientRect();
      var f = r.width > 0 ? (ev.clientX - r.left) / r.width : 0;
      seekTo(Math.max(0, Math.min(f, 1)) * slideDur());
    }

    if (seek) {
      if (seek.btn) seek.btn.addEventListener('click', togglePlay);
      if (seek.back) seek.back.addEventListener('click', function () { if (started && base) seekTo(Math.min(baseTime(), slideDur()) - 10); });
      if (seek.fwd) seek.fwd.addEventListener('click', function () { if (started && base) seekTo(Math.min(baseTime(), slideDur()) + 10); });
      if (seek.vol) { seek.vol.addEventListener('click', function () { setMuted(!muted); }); updateVolUi(); }
      if (seek.cc) { seek.cc.addEventListener('click', function () { setCaptions(!ccOn); }); updateCcUi(); }
      if (seek.fs) {
        seek.fs.addEventListener('click', toggleFullscreen);
        document.addEventListener('fullscreenchange', updateFsUi);
        document.addEventListener('webkitfullscreenchange', updateFsUi);
        updateFsUi();
      }
      if (settings.controlsPos === 'overlay') {
        wrap.addEventListener('pointermove', wakeControls);
        wrap.addEventListener('pointerdown', wakeControls);
        wrap.addEventListener('focusin', wakeControls);
        wrap.addEventListener('keydown', wakeControls);
      }
    }
    if (seek && seek.track) {
      seek.track.addEventListener('pointerdown', function (ev) {
        if (ev.button !== 0 || !started) return;
        ev.preventDefault();
        seek.dragging = true;
        seek.track.className += ' kkp-drag';
        try { seek.track.setPointerCapture(ev.pointerId); } catch (e) {}
        seekFromPointer(ev);
      });
      seek.track.addEventListener('pointermove', function (ev) { if (seek.dragging) seekFromPointer(ev); });
      var endDrag = function () {
        if (!seek.dragging) return;
        seek.dragging = false;
        seek.track.className = seek.track.className.replace(/\s*kkp-drag/g, '');
      };
      seek.track.addEventListener('pointerup', endDrag);
      seek.track.addEventListener('pointercancel', endDrag);
      seek.track.addEventListener('keydown', function (ev) {
        var t = baseTime(), dur = slideDur(), to = null;
        var stepS = ev.shiftKey ? 5 : 1;
        if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') to = Math.min(t, dur) + stepS;
        else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') to = Math.min(t, dur) - stepS;
        else if (ev.key === 'Home') to = 0;
        else if (ev.key === 'End') to = dur;
        else if (ev.key === ' ' || ev.key === 'Spacebar' || ev.key === 'Enter') { ev.preventDefault(); ev.stopPropagation(); togglePlay(); return; }
        else return;
        ev.preventDefault();
        ev.stopPropagation(); // slayt değiştiren ok tuşu kısayolları çalışmasın
        seekTo(to);
      });
    }

    /* --- slayt katmanları --- */

    var baseHidden = false;

    /** Ana katmanın öğelerini gizler/gösterir (arka plan rengi kalır; katmanlar etkilenmez) */
    function setBaseHidden(on) {
      if (baseHidden === on) return;
      baseHidden = on;
      var c = ' ' + stage.className + ' ';
      c = c.replace(' kkp-base-hidden ', ' ');
      stage.className = (c + (on ? 'kkp-base-hidden' : '')).replace(/^\s+|\s+$/g, '');
    }

    /**
     * Duraklatma ve gizleme durumunu tek yerden hesaplar:
     *  - kullanıcı "Duraklat"a bastıysa ana katman ve açık katmanlar durur
     *  - "Ana katmanı duraklat" seçili bir katman açıksa ana katman durur
     *  - "Ana katmanı gizle" seçili bir katman açıksa ana katman öğeleri görünmez
     */
    function syncPause() {
      var pause = userPaused, hide = false;
      for (var i = 0; i < layers.length; i++) {
        if (!layers[i].visible) continue;
        if (layers[i].def.pauseBase) pause = true;
        if (layers[i].def.hideBase) hide = true;
        setClockPaused(layers[i].clock, userPaused);
      }
      setClockPaused(base, pause);
      setBaseHidden(hide);
      updateSeek();
    }

    function findLayer(id) {
      for (var i = 0; i < layers.length; i++) if (layers[i].def.id === id) return layers[i];
      return null;
    }

    function showLayer(L) {
      if (!L || L.visible) return;
      if (L.def.hideOthers !== false) {
        for (var i = 0; i < layers.length; i++) if (layers[i] !== L) hideLayer(layers[i]);
      }
      L.visible = true;
      L.node.style.display = '';
      L.clock.items.forEach(function (it) { it.shown = false; it.resume = false; it.wrap.style.visibility = 'hidden'; });
      L.clock.paused = false;
      L.clock.pausedT = 0;
      L.clock.t0 = now();
      L.clock.lastT = -1;
      syncPause();
      fireEvent(L.clock, 'timelineStart');
    }

    function hideLayer(L) {
      if (!L || !L.visible) return;
      L.visible = false;
      L.node.style.display = 'none';
      L.clock.items.forEach(function (it) { if (it.shown) showItem(it, false); });
      syncPause();
    }

    /* --- tetikleyiciler --- */

    function slideIndexById(id) {
      for (var i = 0; i < slides.length; i++) if (slides[i].id === id) return i;
      return -1;
    }

    function runAction(tr) {
      var a = tr.action, it;
      if (a === 'showLayer') showLayer(findLayer(tr.target));
      else if (a === 'hideLayer') hideLayer(findLayer(tr.target));
      else if (a === 'show' || a === 'hide' || a === 'toggle') {
        it = byId[tr.target];
        if (it) it.hidden = a === 'hide' ? true : a === 'show' ? false : !it.hidden;
      }
      else if (a === 'next') { if (index < slides.length - 1) go(index + 1); }
      else if (a === 'prev') { if (index > 0) go(index - 1); }
      else if (a === 'gotoSlide') {
        var j = slideIndexById(tr.target);
        if (j >= 0) go(j);
      }
      else if (a === 'setVar') setVar(tr);
      else if (a === 'setState') { it = byId[tr.target]; if (it) applyState(it, tr.state); }
      else if (a === 'runJs') runScript(tr);
      else if (a === 'retryQuiz') retryQuiz();
      else if (a === 'exitCourse') exitCourse();
    }

    /* --- Kurstan çık (0.28) ---
     * Oynatma durur (saatler, medya, kalan tetikleyiciler), opts.onExit çağrılır (paket: LMS oturumunu kapatır ve
     * pencereyi kapatmayı dener) ve "Kurstan çıktınız" ekranı gösterilir. Tarayıcı pencereyi kapatmaya izin vermezse
     * (LMS kursu çerçevede açtıysa ya da sekme kullanıcı tarafından açıldıysa) öğrenci bu ekranı görür.
     */
    var exited = false, exitScreen = null;
    function exitCourse() {
      if (exited) return;
      exited = true;
      gen++; // sıradaki eylemler ve zaman olayları çalışmasın
      userPaused = true; syncPause(); // saatler (ana katman + açık katmanlar) durur
      stopClock();
      allItems().forEach(function (it) { if (it.media) { try { it.media.pause(); } catch (e) {} } });
      if (menu && !menu.hidden) toggleMenu(false);
      started = false; // tuşlar ve tıklama tetikleyicileri kapanır
      exitScreen = h('div', 'kkp-start kkp-exit');
      exitScreen.setAttribute('role', 'alertdialog');
      exitScreen.setAttribute('aria-live', 'assertive');
      var t = h('h1'); t.textContent = lb('exitTitle');
      var p = h('p'); p.textContent = lb('exitNote');
      exitScreen.appendChild(t); exitScreen.appendChild(p);
      wrap.appendChild(exitScreen);
      if (opts.onExit) { try { opts.onExit(); } catch (e) {} }
    }

    /* --- JavaScript çalıştır (0.23) ---
     * Kod yalnızca pakette (LMS / web) çalışır; editörün önizlemesi opts.noScripts ile atlar (Storyline'daki gibi;
     * editörün güvenlik ilkesi de kod çalıştırmaya izin vermez) ve opts.onScriptSkipped'i çağırır.
     * Kod new Function ile çalışır; parametreler: player (Learnberry API'si), object(kimlik|ad), GetPlayer() (Storyline uyumlu
     * GetVar/SetVar). Hata kursu durdurmaz: konsola yazılır, sıradaki tetikleyiciler çalışır.
     */
    function runScript(tr) {
      var code = String(tr.code || '');
      if (!code.replace(/\s+/g, '')) return;
      if (opts.noScripts) { if (opts.onScriptSkipped) opts.onScriptSkipped(tr); return; }
      var fn;
      try { fn = new Function('player', 'object', 'GetPlayer', code); }
      catch (err) { scriptError(err, tr); return; }
      try { fn.call(global, scriptApi, scriptObject, scriptGetPlayer); }
      catch (err2) { scriptError(err2, tr); }
    }
    function scriptError(err, tr) {
      try { if (global.console) console.error('[Learnberry] JavaScript tetikleyicisi hata verdi (slayt ' + (index + 1) + '):', err); } catch (e) {}
      if (opts.onScriptError) opts.onScriptError(err, tr);
    }
    function varByNameOf(name) { return varByName[String(name == null ? '' : name).toLowerCase()] || null; }
    function scriptGetVar(name) { var d = varByNameOf(name); return d ? vars[d.id] : undefined; }
    function scriptSetVar(name, value) {
      var d = varByNameOf(name);
      if (!d) { try { console.warn('[Learnberry] Değişken bulunamadı: ' + name); } catch (e) {} return; }
      vars[d.id] = coerce(d.type, value);
      updateTemplates();
    }
    function scriptGetPlayer() { return { GetVar: scriptGetVar, SetVar: scriptSetVar }; }
    function layerByName(name) {
      var n = String(name == null ? '' : name).toLowerCase();
      for (var i = 0; i < layers.length; i++) if (layers[i].def.id === name || String(layers[i].def.name || '').toLowerCase() === n) return layers[i];
      return null;
    }
    var scriptApi = {
      getVar: scriptGetVar,
      setVar: scriptSetVar,
      next: function () { if (index < slides.length - 1) go(index + 1); },
      prev: function () { if (index > 0) go(index - 1); },
      /** sıra numarası (1'den başlar), slayt kimliği ya da adı */
      goToSlide: function (x) {
        var j = typeof x === 'number' ? x - 1 : slideIndexById(x);
        if (j < 0 && typeof x === 'string') for (var i = 0; i < slides.length; i++) if (String(slides[i].name || '').toLowerCase() === x.toLowerCase()) { j = i; break; }
        if (j >= 0 && j < slides.length) go(j);
      },
      showLayer: function (name) { showLayer(layerByName(name)); kick(); },
      hideLayer: function (name) { hideLayer(layerByName(name)); kick(); },
      pause: function () { if (!userPaused) togglePlay(); },
      play: function () { if (userPaused) togglePlay(); },
      get slideIndex() { return index + 1; },
      get slideCount() { return slides.length; },
      get slideName() { return slides[index] ? slides[index].name || '' : ''; }
    };
    /** Öğeye erişim: kimlik ya da ad; x, y, width, height (sahne pikseli), opacity (0–100), visible, state (durum adı), element */
    function scriptObject(ref) {
      var it = byId[ref], k;
      if (!it) {
        var all = allItems(), n = String(ref == null ? '' : ref).toLowerCase();
        for (k = 0; k < all.length; k++) if (String(all[k].e.name || '').toLowerCase() === n) { it = all[k]; break; }
      }
      if (!it) { try { console.warn('[Learnberry] Nesne bulunamadı: ' + ref); } catch (e) {} return null; }
      var w = it.wrap, o = { id: it.e.id, name: it.e.name || '', element: w };
      function num(prop, css) {
        Object.defineProperty(o, prop, {
          enumerable: true,
          get: function () { return parseFloat(w.style[css]) || 0; },
          set: function (v) { v = +v; if (isFinite(v)) w.style[css] = v + 'px'; }
        });
      }
      num('x', 'left'); num('y', 'top'); num('width', 'width'); num('height', 'height');
      Object.defineProperty(o, 'opacity', {
        enumerable: true,
        get: function () { return w.style.opacity === '' ? 100 : Math.round(parseFloat(w.style.opacity) * 100); },
        set: function (v) { v = +v; if (isFinite(v)) w.style.opacity = String(Math.max(0, Math.min(100, v)) / 100); }
      });
      Object.defineProperty(o, 'visible', {
        enumerable: true,
        get: function () { return !!it.shown; },
        set: function (v) { it.hidden = !v; kick(); }
      });
      Object.defineProperty(o, 'state', {
        enumerable: true,
        get: function () { var st = it.stateId === 'normal' ? null : findState(it.e, it.stateId); return st ? st.name : 'Normal'; },
        set: function (v) {
          var id = 'normal', list = it.e.states || [], n2 = String(v == null ? '' : v).toLowerCase();
          for (var i = 0; i < list.length; i++) if (list[i].id === v || String(list[i].name).toLowerCase() === n2) { id = list[i].id; break; }
          applyState(it, id);
        }
      });
      return o;
    }

    /** Öğeyi bir duruma geçirir: içerik o durumun görünümüyle yeniden çizilir (sarmalayıcı, tetikleyiciler, görünürlük aynı kalır) */
    function applyState(it, id) {
      if (!STATE_KEYS[it.e.type]) return;
      var next = id && id !== 'normal' && findState(it.e, id) ? id : 'normal';
      if (next === it.stateId) return;
      it.stateId = next;
      it.view = stateView(it.e, next);
      var w = it.wrap, v = it.view;
      w.style.left = v.x + 'px';
      w.style.top = v.y + 'px';
      w.style.width = v.w + 'px';
      w.style.height = v.h + 'px';
      var fresh = buildContent(v, resolveMedia, 'player');
      w.replaceChild(fresh, it.content);
      it.content = fresh;
      // önceki durumun nesnelerini kaldır, bu durumunkileri ekle (öğenin içinde: görünürlük ve efektler onunla birlikte)
      (it.extras || []).forEach(function (x) { if (x.node.parentNode) x.node.parentNode.removeChild(x.node); });
      it.extras = [];
      (v.extras || []).forEach(function (ex) {
        var n = h('div', 'kkp-x');
        n.style.left = ex.x + 'px';
        n.style.top = ex.y + 'px';
        n.style.width = ex.w + 'px';
        n.style.height = ex.h + 'px';
        n.appendChild(buildContent(ex, resolveMedia, 'player'));
        w.appendChild(n);
        it.extras.push({ view: ex, node: n });
      });
      if (it.wrap.getAttribute('role') === 'button') it.wrap.setAttribute('aria-label', itemLabel(it.view));
      collectTemplates();
    }

    /* --- değişkenler: kurs boyunca değer tutar (slayt değişince ve "baştan oynat"ta sıfırlanmaz) --- */

    var varDefs = {};   // kimlik -> { id, name, type: 'boolean'|'text'|'number', value }
    var varByName = {}; // ad (küçük harf) -> tanım
    var vars = {};      // kimlik -> güncel değer
    var templated = []; // %Ad% içeren metin öğeleri

    function coerce(type, v) {
      if (type === 'number') { v = +v; return isFinite(v) ? v : 0; }
      if (type === 'boolean') return v === true || v === 'true';
      return v == null ? '' : String(v);
    }

    (course.variables || []).forEach(function (v) {
      if (!v || !v.id || !v.name) return;
      varDefs[v.id] = v;
      varByName[String(v.name).toLowerCase()] = v;
      vars[v.id] = coerce(v.type, v.value);
    });

    /** "Değişkeni ayarla": op = set | add | sub | mul | div (sayı), toggle (doğru/yanlış), append (metin) */
    function setVar(tr) {
      var d = varDefs[tr.target];
      if (!d) return;
      var cur = vars[d.id], op = tr.op || 'set', out;
      if (d.type === 'number') {
        var x = coerce('number', tr.value);
        if (op === 'add') out = cur + x;
        else if (op === 'sub') out = cur - x;
        else if (op === 'mul') out = cur * x;
        else if (op === 'div') out = x === 0 ? cur : cur / x; // sıfıra bölme: değer değişmez
        else out = x;
        out = Math.round(out * 1e9) / 1e9; // 0.1 + 0.2 gibi kayan nokta artıkları
      } else if (d.type === 'boolean') {
        out = op === 'toggle' ? !cur : coerce('boolean', tr.value);
      } else {
        out = op === 'append' ? String(cur) + coerce('text', tr.value) : coerce('text', tr.value);
      }
      vars[d.id] = out;
      updateTemplates();
    }

    function formatVar(d, v) {
      if (d.type === 'boolean') return v ? 'Doğru' : 'Yanlış';
      if (d.type === 'number') {
        try { return v.toLocaleString('tr-TR', { maximumFractionDigits: 4, useGrouping: false }); }
        catch (e) { return String(v).replace('.', ','); }
      }
      return String(v);
    }

    var TEMPLATE = /%([^%\s]{1,40})%/g;

    /** %Ad% → değişkenin değeri (tanımsız adlar olduğu gibi kalır) */
    function fillTemplate(text) {
      return String(text).replace(TEMPLATE, function (all, name) {
        var low = name.toLowerCase();
        var d = varByName[low];
        if (d) return formatVar(d, vars[d.id]);
        if (low.indexOf('sonuç.') === 0) { var rv = resultVar(low); if (rv != null) return rv; } // 0.24: sınav sonucu
        return all;
      });
    }

    function updateTemplates() {
      for (var i = 0; i < templated.length; i++) {
        var it = templated[i];
        var txt = fillTemplate(it.text);
        if (it.textNode.textContent !== txt) it.textNode.textContent = txt;
      }
    }

    function collectTemplates() {
      templated = [];
      allItems().forEach(function (it) {
        var add = function (v, root) {
          if ((v.type === 'text' || v.type === 'shape') && v.text && v.text.indexOf('%') >= 0) {
            TEMPLATE.lastIndex = 0;
            if (!TEMPLATE.test(v.text)) return;
            var node = /(^| )kkp-text( |$)/.test(root.className || '') ? root : root.querySelector('.kkp-text');
            if (node) templated.push({ text: v.text, textNode: node });
          }
        };
        add(it.view || it.e, it.content || it.wrap);
        (it.extras || []).forEach(function (x) { add(x.view, x.node); });
      });
      TEMPLATE.lastIndex = 0;
      updateTemplates();
    }

    function runTriggers(it, eventName) {
      if (!started) return;
      var list = it.e.triggers || [];
      var g = gen;
      for (var i = 0; i < list.length; i++) {
        if ((list[i].on || 'click') !== eventName) continue;
        runAction(list[i]);
        if (g !== gen) return; // slayt değişti; kalan eylemler eski slayda aitti
      }
      kick();
    }

    function itemLabel(e) {
      if (e.name) return e.name;
      if (e.type === 'text') return (e.text || '').split('\n')[0] || 'Düğme';
      if (e.type === 'image') return e.alt || 'Görsel';
      if (e.type === 'shape') return (e.text || '').split('\n')[0] || (SHAPES[e.shape] || {}).label || 'Düğme';
      if (e.type === 'hotspot') return 'Tıklanabilir alan';
      return 'Düğme';
    }

    function bindTriggers(it) {
      var has = false;
      (it.e.triggers || []).forEach(function (tr) { if ((tr.on || 'click') === 'click') has = true; });
      if (!has) return;
      var w = it.wrap;
      w.className += ' kkp-click';
      // video/ses kendi denetimlerini taşır; iç içe düğme olmasın diye yalnızca metin/görsel/şekil odaklanabilir
      if (it.e.type === 'text' || it.e.type === 'image' || it.e.type === 'shape' || it.e.type === 'hotspot') {
        w.tabIndex = 0;
        w.setAttribute('role', 'button');
        w.setAttribute('aria-label', itemLabel(it.e));
        w.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
            ev.preventDefault();
            ev.stopPropagation();
            runTriggers(it, 'click');
          }
        });
      }
      w.addEventListener('click', function () { runTriggers(it, 'click'); });
    }

    /** Metin giriş kutuları (0.25): bağlı değişkenin değeriyle başlar, yazdıkça değişkene yazar (%Ad% metinleri güncellenir) */
    function bindInputs() {
      allItems().forEach(function (it) {
        if (it.e.type !== 'input' || !it.content || it.content.tagName !== 'INPUT') return;
        var d = it.e.varId && varDefs[it.e.varId];
        if (!d) return;
        it.content.value = String(vars[d.id] == null ? '' : vars[d.id]);
        it.content.addEventListener('input', function () {
          vars[d.id] = coerce(d.type, it.content.value);
          updateTemplates();
        });
      });
    }

    /* --- sorular ve sınav sonucu (0.24) ---
     * Soru slaytı: slide.quiz = { type: 'pickOne'|'pickMany', choices: [{ id, correct }], submitId, textId, points,
     *   attempts (0 = sınırsız), requireAnswer, feedback: { correct, incorrect, tryAgain } (katman kimlikleri) }.
     * Seçenek tıklanınca seçilir (öğenin "Seçili" adlı durumu varsa o uygulanır, yoksa çerçeve); Gönder değerlendirir,
     * geri bildirim katmanını açar. Cevaplar kurs boyunca tutulur (answers), opts.quizState ile geri yüklenir,
     * opts.onQuizChange ile pakete (suspend_data) yazılır. Sonuç slaytı (slide.results = { pass, fail }) açılınca puan
     * hesaplanır, ilgili katman açılır ve opts.onQuizResult çağrılır. Her son cevap opts.onInteraction ile LMS'e gider.
     */
    var quizPass = Math.max(0, Math.min(100, +((course.quiz || {}).passPercent) || 80));
    var answers = {}; // slayt kimliği -> { sel: [öğe kimliği], tries, done, correct }
    var quizMsg = h('div', 'kkp-quiz-msg');
    quizMsg.hidden = true;
    quizMsg.setAttribute('role', 'status');
    viewport.appendChild(quizMsg);
    var quizMsgTimer = 0;

    function quizOf(s) {
      var q = s && s.quiz;
      if (!q) return null;
      if (q.type === 'pickOne' || q.type === 'pickMany') return q.choices && q.choices.length ? q : null;
      if (q.type === 'textEntry') return q.inputId && q.answers && q.answers.length ? q : null;  // 0.25
      if (q.type === 'hotspot') return q.areaId && q.spots && q.spots.length ? q : null;         // 0.25
      return null;
    }
    function qState(s) { return answers[s.id] || (answers[s.id] = { sel: [], text: '', point: null, tries: 0, done: false, correct: false }); }
    function choiceIdsOf(q) { return q.choices ? choiceIds(q) : []; }
    function choiceIds(q) { var a = []; for (var i = 0; i < q.choices.length; i++) a.push(q.choices[i].id); return a; }
    function inList(list, x) { for (var i = 0; i < list.length; i++) if (list[i] === x) return true; return false; }

    // geri yükleme (paket: LMS'teki suspend_data); biçim: { slaytKimliği: { s: '02', t: 1, d: 1, c: 1 } } (s: seçenek sıraları)
    (function () {
      var saved = opts.quizState;
      if (!saved || typeof saved !== 'object') return;
      slides.forEach(function (sl) {
        var q = quizOf(sl), o = saved[sl.id];
        if (!q || !o) return;
        var ids = choiceIdsOf(q), sel = [];
        String(o.s || '').split('').forEach(function (c) { var k = parseInt(c, 36); if (ids[k]) sel.push(ids[k]); });
        var pt = o.p && o.p.length === 2 && isFinite(+o.p[0]) && isFinite(+o.p[1]) ? { x: +o.p[0], y: +o.p[1] } : null;
        answers[sl.id] = { sel: sel, text: typeof o.x === 'string' ? o.x : '', point: pt, tries: +o.t || 0, done: !!o.d, correct: !!o.c };
      });
    })();
    function quizSnapshot() {
      var out = {}, any = false;
      slides.forEach(function (sl) {
        var q = quizOf(sl), a = answers[sl.id];
        if (!q || !a || (!a.tries && !a.sel.length && !a.text && !a.point)) return;
        var ids = choiceIdsOf(q), s2 = '';
        a.sel.forEach(function (id) { for (var k = 0; k < ids.length; k++) if (ids[k] === id) s2 += k.toString(36); });
        var o2 = { s: s2, t: a.tries, d: a.done ? 1 : 0, c: a.correct ? 1 : 0 };
        if (a.text) o2.x = a.text.slice(0, 200);
        if (a.point) o2.p = [Math.round(a.point.x), Math.round(a.point.y)];
        out[sl.id] = o2;
        any = true;
      });
      return any ? out : null;
    }
    function quizChanged() { if (opts.onQuizChange) opts.onQuizChange(quizSnapshot()); }

    /** Sınav sonucu: puanlar, yüzde, geçti mi */
    function quizResults() {
      var r = { score: 0, total: 0, correct: 0, questions: 0, answered: 0, passPercent: quizPass };
      slides.forEach(function (sl) {
        var q = quizOf(sl);
        if (!q) return;
        var pts = Math.max(0, +q.points || 0), a = answers[sl.id];
        r.questions++;
        r.total += pts;
        if (a && a.done) r.answered++;
        if (a && a.done && a.correct) { r.correct++; r.score += pts; }
      });
      r.percent = r.total ? Math.round(r.score / r.total * 100) : 0;
      r.passed = r.percent >= quizPass;
      return r;
    }
    function resultVar(low) {
      var r = quizResults();
      var map = { 'sonuç.puan': r.score, 'sonuç.toplam': r.total, 'sonuç.yüzde': r.percent, 'sonuç.geçmenotu': quizPass,
        'sonuç.doğru': r.correct, 'sonuç.soru': r.questions, 'sonuç.durum': r.passed ? 'Geçti' : 'Kaldı' };
      return map.hasOwnProperty(low) ? String(map[low]) : null;
    }

    function setClass(node, cls, on) {
      var has = (' ' + node.className + ' ').indexOf(' ' + cls + ' ') >= 0;
      if (on && !has) node.className += ' ' + cls;
      else if (!on && has) node.className = (' ' + node.className + ' ').replace(' ' + cls + ' ', ' ').replace(/^\s+|\s+$/g, '');
    }
    function selectedStateOf(e) {
      var list = e.states || [];
      for (var i = 0; i < list.length; i++) if (String(list[i].name || '').toLowerCase() === 'seçili') return list[i].id;
      return null;
    }
    function quizView(s) {
      var q = quizOf(s);
      if (!q) return;
      var st = qState(s);
      if (q.type === 'textEntry') {
        var inp = byId[q.inputId] && byId[q.inputId].content;
        if (inp && inp.tagName === 'INPUT') {
          if (inp.value !== st.text) inp.value = st.text;
          inp.readOnly = st.done;
        }
        return;
      }
      if (q.type === 'hotspot') {
        var area = byId[q.areaId];
        if (area) setClass(area.wrap, 'kkp-choice-locked', st.done);
        var mk2 = stage.querySelector('.kkp-hs-marker');
        if (!st.point) { if (mk2) mk2.remove(); return; }
        if (!mk2) { mk2 = h('div', 'kkp-hs-marker'); stage.appendChild(mk2); }
        mk2.style.left = st.point.x + 'px';
        mk2.style.top = st.point.y + 'px';
        return;
      }
      q.choices.forEach(function (c) {
        var it = byId[c.id];
        if (!it) return;
        var on = inList(st.sel, c.id), selSt = selectedStateOf(it.e);
        setClass(it.wrap, 'kkp-choice-sel', on);
        setClass(it.wrap, 'kkp-choice-auto', !selSt);
        setClass(it.wrap, 'kkp-choice-locked', st.done);
        it.wrap.setAttribute('aria-checked', on ? 'true' : 'false');
        if (st.done) it.wrap.setAttribute('aria-disabled', 'true'); else it.wrap.removeAttribute('aria-disabled');
        if (selSt) applyState(it, on ? selSt : (it.e.initialState || 'normal'));
      });
    }
    function quizMessage(text) {
      quizMsg.textContent = text;
      quizMsg.hidden = false;
      clearTimeout(quizMsgTimer);
      quizMsgTimer = setTimeout(function () { quizMsg.hidden = true; }, 1800);
    }
    function toggleChoice(s, id) {
      var q = quizOf(s), st = qState(s);
      if (!q || st.done) return;
      if (q.type === 'pickOne') st.sel = [id];
      else if (inList(st.sel, id)) st.sel = st.sel.filter(function (x) { return x !== id; });
      else st.sel = st.sel.concat([id]);
      quizView(s);
      quizChanged();
    }
    function layerByIdOf(id) { for (var i = 0; i < layers.length; i++) if (layers[i].def.id === id) return layers[i]; return null; }
    function submitQuiz(s) {
      var q = quizOf(s), st = qState(s);
      if (!q || st.done) return;
      var right;
      if (q.type === 'textEntry') {
        if (!st.text.replace(/\s+/g, '')) { quizMessage(lb('quizType')); return; }
        var given = normAnswer(st.text, q.caseSensitive);
        right = q.answers.some(function (a) { return normAnswer(a, q.caseSensitive) === given; });
      } else if (q.type === 'hotspot') {
        if (!st.point) { quizMessage(lb('quizClick')); return; }
        right = q.spots.some(function (id) { var it = byId[id]; return it && insideSpot(it.e, st.point); });
      } else {
        if (!st.sel.length) { quizMessage(lb('quizPick')); return; }
        right = q.choices.every(function (c) { return !!c.correct === inList(st.sel, c.id); });
      }
      st.tries++;
      var max = +q.attempts || 0;
      var fb = q.feedback || {}, L;
      if (right || (max && st.tries >= max)) {
        st.done = true;
        st.correct = right;
        L = layerByIdOf(right ? fb.correct : fb.incorrect);
        reportInteraction(s, q, st);
      } else {
        L = layerByIdOf(fb.tryAgain) || layerByIdOf(fb.incorrect);
      }
      quizView(s);
      quizChanged();
      updateNav();
      if (L) { showLayer(L); kick(); }
    }
    /** Metin cevabı karşılaştırma: baş/son boşluk ve çoklu boşluk yok sayılır; istenirse büyük/küçük harf de (Türkçe kurallarıyla) */
    function normAnswer(v, caseSensitive) {
      v = String(v == null ? '' : v).replace(/\s+/g, ' ').replace(/^ | $/g, '');
      if (caseSensitive) return v;
      try { return v.toLocaleLowerCase('tr-TR'); } catch (e) { return v.toLowerCase(); }
    }
    /** Sıcak nokta sorusu: nokta doğru bölgenin içinde mi (0.30: hotspot öğesi de; oval / serbest biçim dahil) */
    function insideSpot(e, p) { return pointInElement(e, p); }

    function reportInteraction(s, q, st) {
      if (!opts.onInteraction) return;
      var n = 0, ord = 0;
      slides.forEach(function (sl, i) { if (quizOf(sl)) { n++; if (sl === s) ord = n; } void i; });
      var keys = 'abcdefghijklmnopqrstuvwxyz';
      var resp = [], corr = [], type = 'choice', type12 = null;
      if (q.type === 'textEntry') {
        type = 'fill-in';
        resp = [st.text.replace(/\s+/g, ' ').replace(/^ | $/g, '').slice(0, 250)];
        corr = [String(q.answers[0] || '').slice(0, 250)];
      } else if (q.type === 'hotspot') {
        type = 'other'; type12 = 'performance'; // SCORM 1.2'de "other" yok
        resp = [Math.round(st.point.x) + ';' + Math.round(st.point.y)];
        corr = ['doğru bölge'];
      } else {
        q.choices.forEach(function (c, k) {
          if (inList(st.sel, c.id)) resp.push(keys.charAt(k));
          if (c.correct) corr.push(keys.charAt(k));
        });
      }
      var textIt = q.textId && byId[q.textId];
      opts.onInteraction({
        id: 'Soru_' + ord, type: type, type12: type12, response: resp, correctResponse: corr, correct: st.correct,
        weighting: Math.max(0, +q.points || 0), description: (textIt && textIt.e.text) || s.name || ('Soru ' + ord)
      });
    }
    function bindQuiz(s) {
      var q = quizOf(s);
      if (!q) return;
      var st0 = qState(s);
      if (q.type === 'textEntry') {
        var ti = byId[q.inputId];
        if (ti && ti.content && ti.content.tagName === 'INPUT') {
          ti.content.addEventListener('input', function () { if (!st0.done) { st0.text = ti.content.value; quizChanged(); } });
          ti.content.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); submitQuiz(s); } });
        }
      } else if (q.type === 'hotspot') {
        q.spots.forEach(function (id) { var sp = byId[id]; if (sp) sp.wrap.className += ' kkp-hs-spot'; });
        var ar = byId[q.areaId];
        if (ar) {
          ar.wrap.className += ' kkp-hs-area';
          ar.wrap.setAttribute('aria-label', itemLabel(ar.e) + ' (tıklanacak alan)');
          ar.wrap.addEventListener('click', function (ev) {
            if (st0.done) return;
            var r = ar.wrap.getBoundingClientRect();
            if (!r.width || !r.height) return;
            st0.point = { x: ar.e.x + (ev.clientX - r.left) * ar.e.w / r.width, y: ar.e.y + (ev.clientY - r.top) * ar.e.h / r.height };
            quizView(s);
            quizChanged();
          });
        }
      }
      (q.choices || []).forEach(function (c) {
        var it = byId[c.id];
        if (!it) return;
        var w = it.wrap;
        w.className += ' kkp-choice';
        w.tabIndex = 0;
        w.setAttribute('role', q.type === 'pickOne' ? 'radio' : 'checkbox');
        w.setAttribute('aria-label', itemLabel(it.e));
        var fire = function () { toggleChoice(s, c.id); };
        w.addEventListener('click', fire);
        w.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') { ev.preventDefault(); ev.stopPropagation(); fire(); }
        });
      });
      var sb = q.submitId && byId[q.submitId];
      if (sb) {
        var w2 = sb.wrap;
        if (w2.className.indexOf('kkp-click') < 0) w2.className += ' kkp-click';
        w2.tabIndex = 0;
        w2.setAttribute('role', 'button');
        w2.setAttribute('aria-label', itemLabel(sb.e));
        w2.addEventListener('click', function () { submitQuiz(s); });
        w2.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') { ev.preventDefault(); ev.stopPropagation(); submitQuiz(s); }
        });
      }
      quizView(s);
    }
    /** Sonuç slaytı: geçti/kaldı katmanı + LMS'e sonuç */
    function showResults(s) {
      if (!s.results) return;
      var r = quizResults();
      var L = layerByIdOf(r.passed ? s.results.pass : s.results.fail);
      if (L) showLayer(L);
      if (opts.onQuizResult) opts.onQuizResult(r);
    }
    /** "Sınavı yeniden başlat": cevaplar silinir, ilk soruya gidilir */
    function retryQuiz() {
      answers = {};
      quizChanged();
      for (var i = 0; i < slides.length; i++) if (quizOf(slides[i])) { go(i); return; }
      go(0);
    }

    function go(i) {
      if (exited) return; // 0.28: kurstan çıkıldıktan sonra slayt değişmez
      if (!slides.length) {
        stage.innerHTML = '';
        title.textContent = 'Bu kursta slayt yok';
        count.textContent = '0 / 0';
        prevBtn.disabled = nextBtn.disabled = true;
        return;
      }
      i = Math.min(Math.max(i, 0), slides.length - 1);
      if (i !== index) { reachedT = 0; secOpen = {}; } // menüde yeni slaydın bölümü açık gelsin
      index = i;
      visited[index] = true;
      stopMedia();
      setBaseHidden(false);
      userPaused = false; // yeni slayt (veya baştan oynatma) her zaman oynayarak başlar
      gen++;
      var s = slides[index];
      base = newClock(renderSlide(stage, s, course, resolveMedia, 'player'), s);
      (s.layers || []).forEach(function (L, li) {
        var node = h('div', 'kkp-layer' + (L.modal ? ' kkp-modal' : ''));
        node.style.zIndex = String(1000 + li);
        node.style.display = 'none';
        node.setAttribute('data-layer', L.id);
        stage.appendChild(node);
        layers.push({ def: L, node: node, visible: false, clock: newClock(renderElements(node, L.elements || [], resolveMedia, 'player'), L) });
      });
      allItems().forEach(function (it) {
        byId[it.e.id] = it;
        bindTriggers(it);
        if (it.e.initialState && it.e.initialState !== 'normal') applyState(it, it.e.initialState);
      });
      bindInputs();
      bindQuiz(s);
      if (s.results) showResults(s);
      collectTemplates();
      title.textContent = s.name || '';
      count.textContent = (index + 1) + ' / ' + slides.length;
      progress.firstChild.style.width = ((index + 1) / slides.length * 100) + '%';
      updateNav();
      fit();
      // önce LMS'e bildir: "başlayınca" tetikleyicisi başka slayta geçerse sıra doğru kalsın
      if (opts.onSlideChange) opts.onSlideChange(index, slides.length);
      if (started) startClock(); else updateSeek();
    }

    prevBtn.addEventListener('click', function () { go(index - 1); });
    nextBtn.addEventListener('click', function () { if (canNext()) go(index + 1); });
    replayBtn.addEventListener('click', function () { go(index); });

    function onKey(ev) {
      if (pod && pod.open) { podKey(ev); return; } // 0.38: podcast görünümü kendi tuşlarını kullanır
      if (cards && cards.open) { cardsKey(ev); return; } // 0.39: kart görünümü
      if (!started) {
        if (exited && ev.key === 'Escape' && opts.onClose) opts.onClose(); // önizleme kurstan çıkıldıktan sonra da kapanır
        return;
      }
      var t = ev.target && ev.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA') return;
      if (ev.key === 'Escape' && menu && !menu.hidden) { toggleMenu(false); menuBtn.focus(); ev.preventDefault(); return; }
      // Önceki/Sonraki gizliyse ok tuşlarıyla da gezinilmez (gezinme tetikleyicilere bırakılmıştır)
      if (settings.prevNext && (ev.key === 'ArrowRight' || ev.key === 'PageDown')) { if (canNext()) go(index + 1); ev.preventDefault(); }
      else if (settings.prevNext && (ev.key === 'ArrowLeft' || ev.key === 'PageUp')) { go(index - 1); ev.preventDefault(); }
      else if (ev.key === 'Escape' && opts.onClose) { opts.onClose(); }
      else if ((ev.key === 'c' || ev.key === 'C') && !ev.ctrlKey && !ev.metaKey && !ev.altKey && seek && seek.cc) { setCaptions(!ccOn); ev.preventDefault(); }
      else if (seek && (ev.key === ' ' || ev.key === 'Spacebar')) {
        // odak bir düğmede/tetikleyicide değilse Boşluk oynat/duraklat
        var el = ev.target;
        if (t === 'BUTTON' || (el && el.getAttribute && el.getAttribute('role'))) return;
        ev.preventDefault();
        togglePlay();
      }
    }
    if (!opts.noKeys) window.addEventListener('keydown', onKey); // noKeys: editördeki küçük ayar önizlemesi
    // pakette sayfadaki başka betikler de Storyline'daki gibi GetPlayer() ile değişkenlere erişebilsin (0.23)
    if (!opts.noScripts) global.GetPlayer = scriptGetPlayer;
    window.addEventListener('resize', fit);
    var ro = null;
    if (global.ResizeObserver) { ro = new global.ResizeObserver(fit); ro.observe(viewport); }

    /* başlangıç ekranı: "Başla" / "Devam et"; kaldığı yer soruluyorsa "Devam et" + "Baştan başla" */
    var start = null;
    function begin(at) {
      started = true;
      if (start) { start.remove(); start = null; }
      if (at !== index) go(at); else { updateNav(); startClock(); }
      var f = nextBtn.isConnected ? nextBtn : (menuBtn || (seek && (seek.btn || seek.row.querySelector('button'))));
      if (f && f.focus) f.focus();
    }
    if (showStart) {
      start = h('div', 'kkp-start');
      var h1 = h('h1'); h1.textContent = course.title || 'Kurs';
      var p = null;
      if (askResume) { p = h('p'); p.textContent = lb('resumePrompt'); } // 0.26: slayt sayısı yazılmıyor
      var btns = h('div', 'kkp-start-btns');
      var sb = h('button', 'kkp-btn primary kkp-start-go');
      sb.type = 'button';
      var ico = h('span', 'kkp-start-ico', ICONS.play);
      ico.setAttribute('aria-hidden', 'true');
      sb.appendChild(ico);
      sb.appendChild(document.createTextNode(askResume || index > 0 ? lb('resume') : lb('start')));
      btns.appendChild(sb);
      sb.addEventListener('click', function () { begin(askResume ? resumeAt : index); });
      if (askResume) {
        var rb = h('button', 'kkp-btn kkp-start-over');
        rb.type = 'button';
        rb.textContent = lb('restart');
        btns.appendChild(rb);
        rb.addEventListener('click', function () { begin(0); });
      }
      if (cardsBtn) { // 0.39: kartlarla incele
        var cb = h('button', 'kkp-btn kkp-start-over kkp-start-cards', ICONS.cards);
        cb.type = 'button';
        cb.appendChild(document.createTextNode(lb('cardsOpen')));
        btns.appendChild(cb);
        cb.addEventListener('click', function () { openCards(askResume ? resumeAt : index); });
      }
      if (podBtn) { // 0.38: slaytlar yerine yalnızca dinle
        var pb = h('button', 'kkp-btn kkp-start-over kkp-start-pod', ICONS.headphones);
        pb.type = 'button';
        pb.appendChild(document.createTextNode(lb('podcastListen')));
        btns.appendChild(pb);
        pb.addEventListener('click', function () { openPodcast(askResume ? resumeAt : index); });
      }
      start.appendChild(h1); if (p) start.appendChild(p); start.appendChild(btns);
      wrap.appendChild(start);
    }

    /* ---------- Podcast modu (0.38) ----------
     * Slaytların üstünde tam ekran dinleme görünümü (.kkp-pod). Tek bir <audio> öğesi parçaları sırayla çalar: telefonda ekran
     * kilitliyken sayfanın saatleri durur ama medya öğesinin olayları (ended / timeupdate) sürer, bu yüzden sıradaki parçaya
     * geçiş yalnızca bu olaylarla yapılır (requestAnimationFrame yok). Kilit ekranı / bildirim denetimleri Media Session API ile.
     * Parça yeni bir slayta geçince o slayt görülmüş sayılır ve opts.onSlideChange ile LMS'e bildirilir (kaldığı yer dahil).
     * "Slaytlara dön" o slaydı normal oynatıcıda açar. Video dosyaları da <audio> ile çalınır (yalnızca sesi).
     */
    var pod = null;
    var podRate = 1;
    function podChapters() {
      var ch = [], seen = {};
      podTracks.forEach(function (tr, k) { if (!seen[tr.slide]) { seen[tr.slide] = true; ch.push({ slide: tr.slide, first: k }); } });
      return ch;
    }
    function podBuild() {
      var box = h('div', 'kkp-pod');
      box.setAttribute('role', 'region');
      box.setAttribute('aria-label', lb('podcast'));
      var inner = h('div', 'kkp-pod-in');
      var head = h('div', 'kkp-pod-head');
      var courseName = h('div', 'kkp-pod-course'); courseName.textContent = course.title || '';
      var back = h('button', 'kkp-btn kkp-pod-back', ICONS.close);
      back.type = 'button';
      back.appendChild(textSpan(lb('podcastBack')));
      head.appendChild(courseName); head.appendChild(back);
      var art = h('div', 'kkp-pod-art', ICONS.headphones);
      art.setAttribute('aria-hidden', 'true');
      var now = h('div', 'kkp-pod-now');
      var no = h('div', 'kkp-pod-no');
      var name = h('div', 'kkp-pod-name');
      now.appendChild(no); now.appendChild(name);
      var cc = h('div', 'kkp-pod-cc');
      cc.setAttribute('aria-live', 'off');
      var bar = h('div', 'kkp-pod-bar');
      var cur = h('span', 'kkp-pod-cur', '0:00');
      var range = h('input', 'kkp-pod-range');
      range.type = 'range'; range.min = '0'; range.max = '0'; range.step = '0.1'; range.value = '0';
      range.setAttribute('aria-label', lb('podcast'));
      var rem = h('span', 'kkp-pod-rem', '0:00');
      bar.appendChild(cur); bar.appendChild(range); bar.appendChild(rem);
      var ctl = h('div', 'kkp-pod-ctl');
      function cbtn(cls, icon, label) {
        var b = h('button', 'kkp-ctl ' + cls, icon);
        b.type = 'button';
        if (label) { b.title = label; b.setAttribute('aria-label', label); }
        ctl.appendChild(b);
        return b;
      }
      var bPrev = cbtn('kkp-pod-prev', ICONS.trackPrev, lb('prev'));
      var bBack = cbtn('kkp-pod-back10', ICONS.back10, lb('skipBack'));
      var bPlay = cbtn('kkp-pod-play', ICONS.pause, lb('pause'));
      var bFwd = cbtn('kkp-pod-fwd10', ICONS.fwd10, lb('skipForward'));
      var bNext = cbtn('kkp-pod-next', ICONS.trackNext, lb('next'));
      var bRate = cbtn('kkp-pod-rate', '', '');
      var listHead = h('div', 'kkp-pod-list-head'); listHead.textContent = lb('podcastChapters');
      var list = h('div', 'kkp-pod-list');
      var audio = h('audio', 'kkp-pod-audio');
      audio.preload = 'auto';
      audio.setAttribute('playsinline', '');
      [head, art, now, cc, bar, ctl, listHead, list, audio].forEach(function (n) { inner.appendChild(n); });
      box.appendChild(inner);
      box.hidden = true;
      wrap.appendChild(box);
      pod = { box: box, audio: audio, no: no, name: name, cc: cc, cur: cur, range: range, rem: rem, play: bPlay, rate: bRate,
        list: list, back: back, i: -1, open: false, ended: false, seeking: false };

      back.addEventListener('click', function () { closePodcast(); });
      bPlay.addEventListener('click', podToggle);
      bPrev.addEventListener('click', podPrev);
      bNext.addEventListener('click', function () { podNext(); });
      bBack.addEventListener('click', function () { podSkip(-10); });
      bFwd.addEventListener('click', function () { podSkip(10); });
      bRate.addEventListener('click', function () {
        var k = SPEEDS.indexOf(podRate);
        podSetRate(SPEEDS[(k + 1) % SPEEDS.length]);
      });
      range.addEventListener('input', function () { pod.seeking = true; podSeek(+range.value); });
      range.addEventListener('change', function () { pod.seeking = false; });
      audio.addEventListener('timeupdate', function () {
        var tr = podTracks[pod.i];
        if (tr && tr.to != null && audio.currentTime >= tr.to - 0.05) { podNext(); return; } // slayttaki bitişi
        podTime();
      });
      audio.addEventListener('ended', function () { podNext(); });
      audio.addEventListener('loadedmetadata', function () { podTime(); });
      audio.addEventListener('play', podPlayUi);
      audio.addEventListener('pause', podPlayUi);
      audio.addEventListener('error', function () { if (pod.open && !audio.paused) podNext(); });
      return pod;
    }
    function podDur() {
      var tr = podTracks[pod.i], d = pod.audio.duration;
      if (!(d > 0) || !isFinite(d)) d = 0;
      if (tr && tr.to != null) d = d ? Math.min(d, tr.to) : tr.to;
      return d;
    }
    function podTime() {
      if (!pod) return;
      var a = pod.audio, d = podDur(), t = Math.min(a.currentTime || 0, d || Infinity);
      pod.range.max = String(d || 0);
      if (!pod.seeking) pod.range.value = String(t);
      pod.cur.textContent = fmtClock(t);
      pod.rem.textContent = '-' + fmtClock(Math.max(0, d - t));
      var tr = podTracks[pod.i];
      var c = tr && tr.e.captions ? captionAt(tr.e.captions, a.currentTime || 0) : null;
      var txt = c ? c.text : '';
      if (pod.cc.textContent !== txt) pod.cc.textContent = txt;
      podPosition();
    }
    function fmtClock(sec) {
      sec = Math.max(0, Math.floor(sec || 0));
      var m = Math.floor(sec / 60), x = sec % 60;
      return m + ':' + (x < 10 ? '0' : '') + x;
    }
    function podPlayUi() {
      if (!pod) return;
      var playing = !pod.audio.paused;
      pod.play.innerHTML = playing ? ICONS.pause : ICONS.play;
      pod.play.title = playing ? lb('pause') : lb('play');
      pod.play.setAttribute('aria-label', pod.play.title);
      var ms = global.navigator && global.navigator.mediaSession;
      if (ms) { try { ms.playbackState = playing ? 'playing' : 'paused'; } catch (e) {} }
    }
    function podSetRate(r) {
      podRate = r;
      pod.audio.playbackRate = r;
      pod.rate.textContent = speedText(r);
      pod.rate.title = lb('speed') + ': ' + speedText(r);
      pod.rate.setAttribute('aria-label', pod.rate.title);
      podPosition();
    }
    function podRenderList() {
      var list = pod.list, cur = podTracks[pod.i] ? podTracks[pod.i].slide : -1;
      list.innerHTML = '';
      podChapters().forEach(function (c, n) {
        var b = h('button', 'kkp-pod-item');
        b.type = 'button';
        b.setAttribute('data-slide', String(c.slide));
        var no = h('span', 'kkp-pod-ino'); no.textContent = String(n + 1);
        var nm = h('span', 'kkp-pod-iname'); nm.textContent = slides[c.slide].name || String(c.slide + 1);
        b.appendChild(no); b.appendChild(nm);
        if (c.slide === cur) b.setAttribute('aria-current', 'true');
        else if (visited[c.slide]) { var ck = h('span', 'kkp-menu-seen', ICONS.check); ck.setAttribute('aria-label', '(görüldü)'); b.appendChild(ck); }
        b.addEventListener('click', function () { podLoad(c.first, true); });
        list.appendChild(b);
      });
    }
    /** k. parçayı yükler; slayt değiştiyse görüldü sayar ve LMS'e bildirir */
    function podLoad(k, play) {
      var tr = podTracks[k];
      if (!tr) return;
      var a = pod.audio, prevSlide = pod.i >= 0 && podTracks[pod.i] ? podTracks[pod.i].slide : -1;
      pod.i = k;
      pod.ended = false;
      if (a.getAttribute('src') !== tr.url) a.src = tr.url; else a.currentTime = 0;
      a.playbackRate = podRate;
      if (play && !opts.silent) {
        var pr = a.play();
        if (pr && pr.catch) pr.catch(function () { podPlayUi(); });
      }
      var chs = podChapters(), n = 0;
      for (var j = 0; j < chs.length; j++) if (chs[j].slide === tr.slide) n = j + 1;
      pod.no.textContent = lb('section') + ' ' + n + ' / ' + chs.length;
      pod.name.textContent = slides[tr.slide].name || String(tr.slide + 1);
      if (tr.slide !== prevSlide) {
        if (tr.slide !== index) { index = tr.slide; reachedT = 0; secOpen = {}; }
        visited[index] = true;
        title.textContent = slides[index].name || '';
        count.textContent = (index + 1) + ' / ' + slides.length;
        progress.firstChild.style.width = ((index + 1) / slides.length * 100) + '%';
        if (opts.onSlideChange) opts.onSlideChange(index, slides.length);
      }
      podRenderList();
      podTime();
      podPlayUi();
      podSession(tr);
    }
    function podNext() {
      if (!pod) return;
      if (pod.i < podTracks.length - 1) { podLoad(pod.i + 1, true); return; }
      pod.audio.pause(); // kursun sonu
      pod.ended = true;
      podPlayUi();
    }
    function podPrev() {
      if (pod.audio.currentTime > 3 || pod.i <= 0) { podSeek(0); return; }
      podLoad(pod.i - 1, true);
    }
    function podSkip(d) { podSeek((pod.audio.currentTime || 0) + d); }
    function podSeek(t) {
      var d = podDur();
      t = Math.max(0, d ? Math.min(t, d - 0.05) : t);
      try { pod.audio.currentTime = t; } catch (e) {}
      podTime();
    }
    function podToggle() {
      var a = pod.audio;
      if (pod.ended) { podLoad(0, true); return; } // sondan baştan
      if (a.paused) {
        if (opts.silent) return;
        var pr = a.play();
        if (pr && pr.catch) pr.catch(function () {});
      } else a.pause();
    }
    function podPosition() {
      var ms = global.navigator && global.navigator.mediaSession, d = podDur();
      if (!ms || !ms.setPositionState || !(d > 0)) return;
      try { ms.setPositionState({ duration: d, playbackRate: podRate, position: Math.min(pod.audio.currentTime || 0, d) }); } catch (e) {}
    }
    /** Kilit ekranı / bildirim denetimleri (desteklenmiyorsa sessizce atlanır) */
    function podSession(tr) {
      var ms = global.navigator && global.navigator.mediaSession;
      if (!ms) return;
      try {
        if (global.MediaMetadata) ms.metadata = new global.MediaMetadata({ title: slides[tr.slide].name || '', artist: course.title || '', album: lb('podcast') });
      } catch (e) {}
      var hs = {
        play: function () { if (pod.audio.paused) podToggle(); },
        pause: function () { pod.audio.pause(); },
        previoustrack: podPrev,
        nexttrack: function () { podNext(); },
        seekbackward: function (d) { podSkip(-((d && d.seekOffset) || 10)); },
        seekforward: function (d) { podSkip((d && d.seekOffset) || 10); },
        seekto: function (d) { if (d && d.seekTime != null) podSeek(d.seekTime); }
      };
      for (var k in hs) if (hs.hasOwnProperty(k)) { try { ms.setActionHandler(k, hs[k]); } catch (e) {} }
    }
    function podSessionClear() {
      var ms = global.navigator && global.navigator.mediaSession;
      if (!ms) return;
      ['play', 'pause', 'previoustrack', 'nexttrack', 'seekbackward', 'seekforward', 'seekto'].forEach(function (k) {
        try { ms.setActionHandler(k, null); } catch (e) {}
      });
      try { ms.metadata = null; ms.playbackState = 'none'; } catch (e) {}
    }
    /** Podcast görünümünü açar; at = başlanacak slayt (o slayttan ya da sonrasından ilk parça) */
    function openPodcast(at) {
      if (exited || !podTracks.length) return;
      if (start) { start.remove(); start = null; }
      started = true;
      toggleMenu(false);
      toggleSpeed(false);
      userPaused = true;
      syncPause(); // slaydın saatleri ve medyası durur
      if (!pod) podBuild();
      podSetRate(rate);
      var from = at == null ? index : at, k = 0;
      for (var j = 0; j < podTracks.length; j++) if (podTracks[j].slide >= from) { k = j; break; }
      pod.box.hidden = false;
      pod.open = true;
      wrap.classList.add('kkp-pod-open');
      podLoad(k, true);
      pod.play.focus();
    }
    /** "Slaytlara dön": dinlenen slayt normal oynatıcıda açılır */
    function closePodcast() {
      if (!pod || !pod.open) return;
      pod.audio.pause();
      pod.open = false;
      pod.box.hidden = true;
      wrap.classList.remove('kkp-pod-open');
      podSessionClear();
      go(index);
      if (podBtn) podBtn.focus();
    }
    function podKey(ev) {
      var t = ev.target && ev.target.tagName;
      if (ev.key === 'Escape') { ev.preventDefault(); closePodcast(); return; }
      if ((ev.key === ' ' || ev.key === 'Spacebar') && t !== 'BUTTON' && t !== 'INPUT') { ev.preventDefault(); podToggle(); }
    }
    if (podBtn) podBtn.addEventListener('click', function () { openPodcast(index); });

    /* ---------- Mikro-öğrenme kartları (0.39) ----------
     * Telefonda dikey kart görünümü (.kkp-cards, max 480 px, masaüstünde ortada): üstte CANLI slayt — oynatıcının viewport'u
     * (sahne, katmanlar, sorular, medya) kartın .kkp-card-stage alanına taşınır, kapanınca yerine (yorum düğümü çapası) geri
     * döner; böylece animasyon, ses, video, tıklama ve sorular olduğu gibi çalışır. Altta kart metni (cardText), üstte
     * hikâye çizgileri (kart başına; geçerli olan slaydın saatiyle dolar), altta Önceki / oynat-duraklat / baştan / Sonraki.
     * Kartlar arası geçiş go() ile (görüldü, LMS bildirimi, kilitler — canNext — normal oynatıcıdaki gibi); parmakla sola/sağa
     * kaydırma, ← → tuşları. "Kartlarda gösterme" işaretli slaytlar atlanır. Denetim çubuğu, üst çubuk, altyazı ve menü kartta
     * gizli (altyazı metni zaten kart metni olabilir).
     */
    var cards = null;
    function cardsBuild() {
      var box = h('div', 'kkp-cards');
      box.setAttribute('role', 'region');
      box.setAttribute('aria-label', lb('cards'));
      var inner = h('div', 'kkp-cards-in');
      var bars = h('div', 'kkp-cards-bars');
      bars.setAttribute('aria-hidden', 'true');
      cardIdx.forEach(function () { bars.appendChild(h('div', 'kkp-cards-bar', '<i></i>')); });
      var head = h('div', 'kkp-cards-head');
      var cnt = h('div', 'kkp-cards-count');
      var name = h('div', 'kkp-cards-name');
      var close = h('button', 'kkp-btn kkp-cards-close', ICONS.close);
      close.type = 'button';
      close.appendChild(textSpan(lb('cardsBack')));
      head.appendChild(cnt); head.appendChild(name); head.appendChild(close);
      var card = h('div', 'kkp-card');
      var holder = h('div', 'kkp-card-stage');
      // 0.40: slaydın gerçek oranı; dikey slayt kartta ekran yüksekliğinin en çok %58'i kadar (metne ve düğmelere yer kalsın)
      var ar = course.width / course.height;
      holder.style.aspectRatio = course.width + ' / ' + course.height;
      if (ar < 1.2) { holder.style.width = 'min(100%, calc(58vh * ' + (Math.round(ar * 1000) / 1000) + '))'; holder.style.alignSelf = 'center'; }
      var text = h('div', 'kkp-card-text');
      text.setAttribute('tabindex', '0');
      card.appendChild(holder); card.appendChild(text);
      var ctl = h('div', 'kkp-cards-ctl');
      var bPrev = h('button', 'kkp-btn kkp-cards-prev', ICONS.prev);
      bPrev.type = 'button'; bPrev.title = lb('prev'); bPrev.setAttribute('aria-label', lb('prev'));
      var bPlay = h('button', 'kkp-ctl kkp-cards-play', ICONS.pause);
      bPlay.type = 'button';
      var bReplay = h('button', 'kkp-ctl kkp-cards-replay', ICONS.replay);
      bReplay.type = 'button'; bReplay.title = lb('replay'); bReplay.setAttribute('aria-label', lb('replay'));
      var bNext = h('button', 'kkp-btn primary kkp-cards-next');
      bNext.type = 'button';
      bNext.appendChild(textSpan(lb('next')));
      bNext.insertAdjacentHTML('beforeend', ICONS.next);
      [bPrev, bPlay, bReplay, bNext].forEach(function (b) { ctl.appendChild(b); });
      var msg = h('div', 'kkp-cards-msg');
      msg.hidden = true;
      msg.setAttribute('role', 'status');
      var hint = h('div', 'kkp-cards-hint', '<div class="kkp-hint-track" aria-hidden="true"><span class="kkp-hint-dot"></span></div>');
      var hintText = h('div', 'kkp-hint-text');
      hintText.textContent = lb('cardsHint');
      hint.appendChild(hintText);
      hint.setAttribute('role', 'status');
      hint.hidden = true;
      [bars, head, card, ctl, msg, hint].forEach(function (n) { inner.appendChild(n); });
      box.appendChild(inner);
      box.hidden = true;
      wrap.appendChild(box);
      cards = { box: box, bars: bars, count: cnt, name: name, close: close, card: card, holder: holder, text: text,
        prev: bPrev, play: bPlay, next: bNext, msg: msg, hint: hint, hinted: false, open: false, anchor: null, shown: -1, dir: 0, state: '' };
      // ipucu: ilk dokunuş / kaydırma / tuş onu kapatır
      box.addEventListener('pointerdown', function () { cardsHintHide(); }, true);

      close.addEventListener('click', function () { closeCards(); });
      bPrev.addEventListener('click', cardPrev);
      bNext.addEventListener('click', cardNext);
      bPlay.addEventListener('click', function () { togglePlay(); cardsPlayUi(); });
      bReplay.addEventListener('click', function () { go(index); });
      // parmakla kaydırma: yatayda 50 px'den uzun ve dikeyden belirgin hareket
      var sw = null, tapOff = false;
      card.addEventListener('pointerdown', function (ev) { sw = { x: ev.clientX, y: ev.clientY, id: ev.pointerId }; tapOff = false; });
      card.addEventListener('pointerup', function (ev) {
        if (!sw || sw.id !== ev.pointerId) return;
        var dx = ev.clientX - sw.x, dy = ev.clientY - sw.y;
        sw = null;
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) tapOff = true; // kaydırma / metni kaydırma: dokunma sayılmaz
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) cardNext(); else cardPrev(); }
      });
      card.addEventListener('pointercancel', function () { sw = null; tapOff = true; });
      /*
       * 0.39.1: Instagram hikâyesi gibi dokunarak geçiş — kartın sol üçte biri önceki, kalanı sonraki kart. Slayt canlı olduğu için
       * tıklanabilir öğeler (tetikleyicili öğe / hotspot, soru seçeneği ve tıklama alanı, giriş kutusu, video, "oynatmak için
       * tıklayın") ve açık modal katman dokunuşu kendileri alır; kart değişmez.
       */
      card.addEventListener('click', function (ev) {
        if (tapOff) { tapOff = false; return; }
        if (cardTapTarget(ev.target)) return;
        var r = card.getBoundingClientRect();
        if (ev.clientX - r.left < r.width / 3) cardPrev(); else cardNext();
      });
      card.addEventListener('animationend', function () { card.classList.remove('kkp-card-in-next', 'kkp-card-in-prev', 'kkp-card-peek'); });
      return cards;
    }
    /*
     * 0.39.2: kaydırma ipucu. Kartlar ilk açıldığında (sonraki kart varsa) kartın ortasında parmak izi animasyonu + yazı, kart iki kez
     * hafifçe sola esner; dokunma, kaydırma, tuş ya da 5 sn sonra kaybolur. Pakette kurs başına bir kez (localStorage; erişilemezse
     * oturumda bir kez), editör önizlemesinde (opts.onClose var) her önizlemede bir kez.
     */
    var hintKey = 'kkp-cards-hint:' + (course.id || course.title || '');
    var hintTimer = 0;
    function hintSeen() {
      if (opts.onClose) return false;
      try { return global.localStorage.getItem(hintKey) === '1'; } catch (e) { return false; }
    }
    function cardsHintShow() {
      if (cards.hinted || cardAfter(index) < 0 || hintSeen()) return;
      cards.hinted = true;
      if (!opts.onClose) { try { global.localStorage.setItem(hintKey, '1'); } catch (e) {} }
      cards.hint.classList.remove('kkp-hint-out');
      cards.hint.hidden = false;
      cards.card.classList.remove('kkp-card-in-next', 'kkp-card-in-prev');
      cards.card.classList.add('kkp-card-peek');
      clearTimeout(hintTimer);
      hintTimer = setTimeout(cardsHintHide, 5000);
    }
    function cardsHintHide() {
      if (!cards || cards.hint.hidden) return;
      clearTimeout(hintTimer);
      cards.card.classList.remove('kkp-card-peek');
      cards.hint.classList.add('kkp-hint-out');
      hintTimer = setTimeout(function () { cards.hint.hidden = true; cards.hint.classList.remove('kkp-hint-out'); }, 300);
    }

    /** Dokunuşu kendisi alan (kart geçişi yapmayan) hedef mi */
    function cardTapTarget(t) {
      return !!(t && t.closest && t.closest('button, a, input, textarea, select, label, video, audio, [role="button"], [role="radio"], ' +
        '[role="checkbox"], [role="slider"], .kkp-choice, .kkp-hs-area, .kkp-tap, .kkp-modal'));
    }
    function cardAfter(i) { for (var k = 0; k < cardIdx.length; k++) if (cardIdx[k] > i) return cardIdx[k]; return -1; }
    function cardBefore(i) { for (var k = cardIdx.length - 1; k >= 0; k--) if (cardIdx[k] < i) return cardIdx[k]; return -1; }
    var cardMsgTimer = 0;
    function cardsSay(t) {
      cards.msg.textContent = t;
      cards.msg.hidden = false;
      clearTimeout(cardMsgTimer);
      cardMsgTimer = setTimeout(function () { if (cards) cards.msg.hidden = true; }, 2400);
    }
    function cardNext() {
      var j = cardAfter(index);
      if (j < 0) return;
      if (!canNext()) { cardsSay(quizOf(slides[index]) && !qState(slides[index]).done ? lb('quizLocked') : lb('lockedNext')); return; }
      cards.dir = 1;
      go(j);
    }
    function cardPrev() {
      var j = cardBefore(index);
      if (j < 0) return;
      cards.dir = -1;
      go(j);
    }
    function cardsPlayUi() {
      if (!cards) return;
      var dur = slideDur(), t = started && base ? Math.min(baseTime(now()), dur) : 0;
      var st = userPaused ? 'play' : (t >= dur - 0.01 ? 'replay' : 'pause');
      if (st === cards.state) return;
      cards.state = st;
      cards.play.innerHTML = ICONS[st];
      var label = { play: lb('play'), pause: lb('pause'), replay: lb('replay') }[st];
      cards.play.title = label;
      cards.play.setAttribute('aria-label', label);
    }
    /** Kart değişince / gezinme durumu değişince: sayaç, ad, metin, çizgiler, düğmeler */
    function cardsUpdate() {
      var pos = cardIdx.indexOf(index), s = slides[index];
      cards.count.textContent = pos >= 0 ? (pos + 1) + ' / ' + cardIdx.length : '';
      cards.name.textContent = (s && s.name) || '';
      var txt = s ? fillTemplate(cardText(s)) : '';
      if (cards.shown !== index) {
        cards.text.textContent = txt;
        cards.text.scrollTop = 0;
        cards.card.classList.toggle('kkp-card-notext', !txt);
        if (cards.shown >= 0 && cards.dir) {
          cards.card.classList.remove('kkp-card-in-next', 'kkp-card-in-prev');
          void cards.card.offsetWidth;
          cards.card.classList.add(cards.dir > 0 ? 'kkp-card-in-next' : 'kkp-card-in-prev');
        }
        if (cards.shown >= 0) cardsHintHide();
        cards.shown = index;
        cards.dir = 0;
        cards.state = '';
      }
      var bs = cards.bars.children;
      for (var k = 0; k < bs.length; k++) bs[k].firstChild.style.width = (pos >= 0 && k < pos) || (pos < 0 && cardIdx[k] < index) ? '100%' : '0';
      cards.prev.disabled = cardBefore(index) < 0;
      var nj = cardAfter(index);
      cards.next.disabled = nj < 0;
      cards.next.classList.toggle('kkp-card-ready', nj >= 0 && !!done[index] && canNext());
      cardsPlayUi();
    }
    /** Her karede: geçerli kartın çizgisi slaydın saatiyle dolar */
    function cardsProgress(n) {
      var pos = cardIdx.indexOf(index);
      if (pos >= 0 && base) {
        var dur = slideDur(), t = Math.min(baseTime(n), dur);
        cards.bars.children[pos].firstChild.style.width = (dur > 0 ? Math.min(100, t / dur * 100) : 100) + '%';
      }
      var ready = cardAfter(index) >= 0 && !!done[index] && canNext();
      if (ready !== cards.next.classList.contains('kkp-card-ready')) cards.next.classList.toggle('kkp-card-ready', ready);
      cardsPlayUi();
    }
    /** Kart görünümünü açar; at = başlanacak slayt (kart değilse sonraki kart) */
    function openCards(at) {
      if (exited || !cardIdx.length) return;
      if (pod && pod.open) closePodcast();
      if (!cards) cardsBuild();
      toggleMenu(false);
      toggleSpeed(false);
      var from = at == null ? index : at;
      var target = cardIdx.indexOf(from) >= 0 ? from : cardAfter(from);
      if (target < 0) target = cardIdx[cardIdx.length - 1];
      var wasStarted = started;
      if (start) { start.remove(); start = null; }
      started = true;
      cards.anchor = document.createComment('kkp-viewport');
      viewport.parentNode.insertBefore(cards.anchor, viewport);
      cards.holder.appendChild(viewport);
      cards.box.hidden = false;
      cards.open = true;
      cards.shown = -1;
      wrap.classList.add('kkp-cards-open');
      if (!wasStarted || target !== index) go(target);
      else { fit(); cardsUpdate(); kick(); }
      cards.next.focus();
      cardsHintShow(); // 0.39.2
    }
    /** "Slaytlara dön": aynı slayt normal oynatıcıda sürer */
    function closeCards() {
      if (!cards || !cards.open) return;
      cards.open = false;
      cards.box.hidden = true;
      cards.msg.hidden = true;
      clearTimeout(hintTimer);
      cards.hint.hidden = true;
      cards.card.classList.remove('kkp-card-peek');
      if (cards.anchor && cards.anchor.parentNode) {
        cards.anchor.parentNode.insertBefore(viewport, cards.anchor);
        cards.anchor.parentNode.removeChild(cards.anchor);
      }
      cards.anchor = null;
      wrap.classList.remove('kkp-cards-open');
      fit();
      updateNav();
      kick();
      if (cardsBtn) cardsBtn.focus();
    }
    function cardsKey(ev) {
      cardsHintHide();
      var t = ev.target && ev.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA') return; // metin girişi sorusu
      if (ev.key === 'Escape') { ev.preventDefault(); closeCards(); return; }
      if (ev.key === 'ArrowRight') { ev.preventDefault(); cardNext(); return; }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); cardPrev(); return; }
      if ((ev.key === ' ' || ev.key === 'Spacebar') && t !== 'BUTTON') { ev.preventDefault(); togglePlay(); cardsPlayUi(); }
    }
    if (cardsBtn) cardsBtn.addEventListener('click', function () { openCards(index); });

    go(index);

    return {
      go: go,
      /** podcast modu (0.38): açık mı, parça listesi, o anki parça, aç / kapat */
      get podcast() {
        return { open: !!(pod && pod.open), tracks: podTracks.length, index: pod ? pod.i : -1, slide: pod && podTracks[pod.i] ? podTracks[pod.i].slide : -1,
          ended: !!(pod && pod.ended), rate: podRate, audio: pod ? pod.audio : null };
      },
      openPodcast: openPodcast,
      closePodcast: closePodcast,
      /** mikro-öğrenme kartları (0.39): açık mı, kart slaytları, geçerli kartın sırası */
      get cards() { return { open: !!(cards && cards.open), slides: cardIdx.slice(), pos: cardIdx.indexOf(index), hint: !!(cards && !cards.hint.hidden) }; },
      openCards: openCards,
      closeCards: closeCards,
      get index() { return index; },
      /** açık katmanların kimlikleri (test / hata ayıklama) */
      get openLayers() {
        var a = [];
        for (var i = 0; i < layers.length; i++) if (layers[i].visible) a.push(layers[i].def.id);
        return a;
      },
      get basePaused() { return !!(base && base.paused); },
      get baseHidden() { return baseHidden; },
      /** ana katmanın saati (sn) ve kullanıcı duraklatması */
      get time() { return baseTime(); },
      /** öğenin güncel durumunun adı ('Normal' ya da durum adı) */
      stateOf: function (id) {
        var it = byId[id];
        if (!it) return null;
        var st = findState(it.e, it.stateId);
        return st ? st.name : 'Normal';
      },
      /** değişkenlerin güncel değerleri: { Ad: değer } */
      get vars() {
        var o = {};
        for (var k in varDefs) if (varDefs.hasOwnProperty(k)) o[varDefs[k].name] = vars[k];
        return o;
      },
      get paused() { return userPaused; },
      /** "Sonraki" açık mı (slayt sonuna kadar izlendi mi / kilit kapalı mı) */
      get canNext() { return canNext(); },
      get visited() { var a = []; for (var k in visited) if (visited.hasOwnProperty(k)) a.push(+k); return a.sort(function (x, y) { return x - y; }); },
      toggleMenu: toggleMenu,
      /** oynatma hızı (1 = normal) */
      get rate() { return rate; },
      setRate: setRate,
      seek: seekTo,
      togglePlay: togglePlay,
      /** ses kapalı mı (ses düğmesi) */
      get muted() { return muted; },
      setMuted: setMuted,
      /** altyazılar açık mı (CC düğmesi) ve şu an gösterilen metin */
      get captionsOn() { return ccOn; },
      setCaptions: setCaptions,
      get captionText() { return ccCurrent ? ccCurrent.text : ''; },
      /** sorular (0.24) */
      get quizResults() { return quizResults(); },
      get quizState() { return quizSnapshot(); },
      /** JavaScript tetikleyicilerinin gördüğü API (testler için) */
      script: { api: scriptApi, object: scriptObject, GetPlayer: scriptGetPlayer },
      /** "Kurstan çık" tetikleyicisi çalıştı mı (0.28) */
      get exited() { return exited; },
      destroy: function () {
        stopMedia();
        if (pod) { try { pod.audio.pause(); } catch (e) {} podSessionClear(); }
        clearTimeout(idleTimer);
        document.removeEventListener('fullscreenchange', updateFsUi);
        document.removeEventListener('webkitfullscreenchange', updateFsUi);
        if (fsElement() === root) toggleFullscreen();
        if (!opts.noKeys) window.removeEventListener('keydown', onKey);
        window.removeEventListener('resize', fit);
        if (ro) ro.disconnect();
        wrap.remove();
      }
    };
  }

  /* ---------------- LMS bağlantısı: SCORM 1.2 ve SCORM 2004 ---------------- */
  /*
   * Paketteki önyükleyici SCORM.init({ version: '1.2'|'2004', status: <bildirim biçimi> }) çağırır; sonra iki standart
   * için ortak işlevler kullanılır: location / setLocation (lesson_location | location), suspendData / setSuspendData,
   * complete() (bildirim biçimine göre completed ya da passed), fail() (soru slaytları için hazır; şimdilik çağrılmıyor),
   * finish() (session_time, exit, LMSFinish | Terminate). get/set/commit ham erişim içindir (anahtar sürüme göre verilir).
   */
  var SCORM = (function () {
    var api = null, active = false, startedAt = Date.now(), finished = false;
    var v2004 = false, mode = 'completedIncomplete';

    function findIn(win, name) {
      var tries = 0;
      try {
        while (win && !win[name] && win.parent && win.parent !== win && tries < 12) {
          tries++;
          win = win.parent;
        }
        return win && win[name] ? win[name] : null;
      } catch (e) {
        return null; // farklı kökenli çerçeveye erişim engellendi
      }
    }

    function locate(name) {
      var a = findIn(window, name);
      if (!a) { try { if (window.opener) a = findIn(window.opener, name); } catch (e) {} }
      return a;
    }

    function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }

    // SCORM 1.2 CMITimespan: HHHH:MM:SS.SS
    function timespan(ms) {
      var cs = Math.floor(ms / 10);
      var hh = Math.floor(cs / 360000); cs -= hh * 360000;
      var mm = Math.floor(cs / 6000); cs -= mm * 6000;
      var ss = Math.floor(cs / 100); cs -= ss * 100;
      return pad(Math.min(hh, 9999), 4) + ':' + pad(mm, 2) + ':' + pad(ss, 2) + '.' + pad(cs, 2);
    }

    // SCORM 2004 timeinterval (ISO 8601 süre): PT1H2M3.45S
    function isoDuration(ms) {
      var cs = Math.max(0, Math.floor(ms / 10));
      var hh = Math.floor(cs / 360000); cs -= hh * 360000;
      var mm = Math.floor(cs / 6000); cs -= mm * 6000;
      var ss = Math.floor(cs / 100); cs -= ss * 100;
      return 'PT' + (hh ? hh + 'H' : '') + (hh || mm ? mm + 'M' : '') + ss + (cs ? '.' + pad(cs, 2) : '') + 'S';
    }

    function call(fn12, fn2004, a, b) {
      var f = api[v2004 ? fn2004 : fn12];
      return arguments.length > 3 ? f.call(api, a, b) : f.call(api, a);
    }
    function get(k) { if (!active) return ''; try { var r = call('LMSGetValue', 'GetValue', k); return r == null ? '' : String(r); } catch (e) { return ''; } }
    function set(k, v) { if (!active) return false; try { return String(call('LMSSetValue', 'SetValue', k, String(v))) === 'true'; } catch (e) { return false; } }
    function commit() { if (!active) return false; try { return String(call('LMSCommit', 'Commit', '')) === 'true'; } catch (e) { return false; } }

    var K12 = { location: 'cmi.core.lesson_location', suspend: 'cmi.suspend_data', status: 'cmi.core.lesson_status', time: 'cmi.core.session_time', exit: 'cmi.core.exit' };
    var K04 = { location: 'cmi.location', suspend: 'cmi.suspend_data', status: 'cmi.completion_status', success: 'cmi.success_status', time: 'cmi.session_time', exit: 'cmi.exit' };
    function key(k) { return (v2004 ? K04 : K12)[k]; }

    /** Kurs bitmiş mi (LMS'te tamamlandı / geçti) */
    function isDone() {
      if (!active) return false;
      if (v2004) return get(K04.status) === 'completed';
      var st = get(K12.status);
      return st === 'completed' || st === 'passed';
    }

    function init(cfg) {
      cfg = cfg || {};
      v2004 = cfg.version === '2004';
      if (cfg.status) mode = String(cfg.status);
      api = locate(v2004 ? 'API_1484_11' : 'API');
      if (!api) return false;
      try { active = String(call('LMSInitialize', 'Initialize', '')) === 'true'; } catch (e) { active = false; }
      if (active) {
        startedAt = Date.now();
        var st = get(key('status'));
        if (v2004) {
          if (st !== 'completed' && st !== 'incomplete') set(K04.status, 'incomplete'); // '', 'not attempted', 'unknown'
        } else if (st === '' || st === 'not attempted') set(K12.status, 'incomplete');
        commit();
      }
      return active;
    }

    /** Bildirim biçimine göre başarı: "Geçti …" → passed, "Tamamlandı …" → completed */
    function complete() {
      if (!active) return false;
      var passed = mode.indexOf('passed') === 0;
      if (v2004) {
        set(K04.status, 'completed');
        if (passed) set(K04.success, 'passed');
      } else {
        var st = get(K12.status);
        if (st !== 'passed') set(K12.status, passed ? 'passed' : 'completed'); // "geçti" geri alınmaz
      }
      return commit();
    }

    /** Başarısızlık (yalnızca "… / Kaldı" biçimlerinde); soru slaytları eklenince kullanılacak */
    function fail() {
      if (!active || !/Failed$/.test(mode)) return false;
      if (v2004) { set(K04.status, 'completed'); set(K04.success, 'failed'); }
      else set(K12.status, 'failed');
      return commit();
    }

    /** Sınav puanı (0.24): yüzde olarak raw/min/max (2004'te ayrıca scaled) */
    function setScore(percent) {
      if (!active) return false;
      percent = Math.max(0, Math.min(100, Math.round(+percent || 0)));
      if (v2004) {
        set('cmi.score.scaled', String(percent / 100));
        set('cmi.score.raw', percent); set('cmi.score.min', 0); set('cmi.score.max', 100);
      } else {
        set('cmi.core.score.raw', percent); set('cmi.core.score.min', 0); set('cmi.core.score.max', 100);
      }
      return commit();
    }

    /**
     * Soru bazında etkileşim kaydı (0.24): d = { id, type: 'choice', response: ['a'], correctResponse: ['b'], correct,
     * weighting, description }. Yeni kayıt sona eklenir (cmi.interactions._count).
     */
    function interaction(d) {
      if (!active) return false;
      var n = parseInt(get('cmi.interactions._count'), 10);
      if (!(n >= 0)) n = 0;
      var p = 'cmi.interactions.' + n + '.';
      var id = String(d.id || ('Soru_' + (n + 1))).replace(/[^A-Za-z0-9_.-]/g, '_');
      set(p + 'id', id);
      set(p + 'type', (!v2004 && d.type12) || d.type || 'choice');
      if (v2004) {
        set(p + 'description', String(d.description || '').slice(0, 250));
        set(p + 'learner_response', (d.response || []).join('[,]'));
        set(p + 'correct_responses.0.pattern', (d.correctResponse || []).join('[,]'));
        set(p + 'result', d.correct ? 'correct' : 'incorrect');
        set(p + 'weighting', String(+d.weighting || 0));
        set(p + 'timestamp', new Date().toISOString().replace(/\.\d+Z$/, ''));
      } else {
        set(p + 'student_response', (d.response || []).join(','));
        set(p + 'correct_responses.0.pattern', (d.correctResponse || []).join(','));
        set(p + 'result', d.correct ? 'correct' : 'wrong');
        set(p + 'weighting', String(+d.weighting || 0));
        var now = new Date();
        set(p + 'time', pad(now.getHours(), 2) + ':' + pad(now.getMinutes(), 2) + ':' + pad(now.getSeconds(), 2));
      }
      return commit();
    }

    /** Sınav sonucuna göre durum: geçti → complete(); kaldı → "… / Kaldı" biçiminde fail(), değilse "tamamlanmadı" kalır */
    function quizStatus(passed) {
      if (!active) return false;
      return passed ? complete() : fail();
    }

    /**
     * exitCourse (0.28, "Kurstan çık" tetikleyicisi): SCORM 2004'te LMS'ten kursu kapatmasını da ister
     * (adl.nav.request: bittiyse exitAll, bitmediyse suspendAll — kaldığı yer korunur). 1.2'de böyle bir istek yok.
     */
    function finish(exitCourse) {
      if (!active || finished) return;
      finished = true;
      var done = isDone();
      set(key('time'), v2004 ? isoDuration(Date.now() - startedAt) : timespan(Date.now() - startedAt));
      set(key('exit'), done ? (v2004 ? 'normal' : '') : 'suspend');
      if (exitCourse && v2004) set('adl.nav.request', done ? 'exitAll' : 'suspendAll');
      commit();
      try { call('LMSFinish', 'Terminate', ''); } catch (e) {}
      active = false;
    }

    return {
      init: init, get: get, set: set, commit: commit, finish: finish,
      complete: complete, fail: fail, isDone: isDone,
      setScore: setScore, interaction: interaction, quizStatus: quizStatus,
      location: function () { return get(key('location')); },
      setLocation: function (v) { return set(key('location'), v); },
      suspendData: function () { return get(key('suspend')); },
      setSuspendData: function (v) { return set(key('suspend'), v); },
      timespan: timespan, isoDuration: isoDuration,
      get active() { return active; },
      get version() { return v2004 ? '2004' : '1.2'; }
    };
  })();

  global.KKPlayer = {
    injectCSS: injectCSS,
    FX_IN: FX_IN,
    FX_OUT: FX_OUT,
    fxDur: fxDur,
    fxPhase: fxPhase,
    fxAnimation: fxAnimation,
    itemEnd: itemEnd,
    buildContent: buildContent,
    renderSlide: renderSlide,
    renderElements: renderElements,
    SHAPES: SHAPES,
    STATE_KEYS: STATE_KEYS,
    stateView: stateView,
    shapeMarkup: shapeMarkup,
    HOTSPOT_SHAPES: HOTSPOT_SHAPES,
    hotspotPoints: hotspotPoints,
    pointInElement: pointInElement,
    PLAYER_DEFAULTS: PLAYER_DEFAULTS,
    LABEL_DEFAULTS: LABEL_DEFAULTS,
    SPEEDS: SPEEDS,
    playerLabel: playerLabel,
    fontCss: fontCss,
    playerSettings: playerSettings,
    slideDuration: slideDuration,
    menuEntries: menuEntries,
    MENU_MAX_LEVEL: MENU_MAX_LEVEL,
    captionAt: captionAt,
    podcastTracks: podcastTracks,
    cardsEnabled: cardsEnabled,
    cardSlides: cardSlides,
    cardText: cardText,
    podcastEnabled: podcastEnabled,
    createPlayer: createPlayer,
    SCORM: SCORM
  };
}
KKPlayerRuntime(window);
