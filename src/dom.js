const $ = id => document.getElementById(id);
const canvas = $('stage');
const objectiveEl = $('objective'), yarnEl = $('yarnCount'), yarnLabel = $('yarnLabel'), roomLabel = $('roomLabel'), chipsEl = $('chips');
const titleOverlay = $('titleOverlay'), blessOverlay = $('blessOverlay'), napOverlay = $('napOverlay');
const srcEls = [$('src1'), $('src2')];
const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

export { $, canvas, objectiveEl, yarnEl, yarnLabel, roomLabel, chipsEl, titleOverlay, blessOverlay, napOverlay, srcEls, reduceMotion };
