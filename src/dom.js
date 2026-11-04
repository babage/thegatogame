const $ = id => document.getElementById(id);
const canvas = $('stage');
const objectiveEl = $('objective'), yarnEl = $('yarnCount'), roomLabel = $('roomLabel'), chipsEl = $('chips');
const titleOverlay = $('titleOverlay'), hubOverlay = $('hubOverlay'), blessOverlay = $('blessOverlay'), napOverlay = $('napOverlay');
const srcEls = [$('src1'), $('src2')];
const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

export { $, canvas, objectiveEl, yarnEl, roomLabel, chipsEl, titleOverlay, hubOverlay, blessOverlay, napOverlay, srcEls, reduceMotion };
