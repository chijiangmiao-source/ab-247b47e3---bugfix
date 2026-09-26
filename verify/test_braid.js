/*
 * test_braid.js — 辫群业务样例与代数性质的代码测试（Node 直接运行核心 braid.js）。
 * 伪随机仅用于生成测试用例（固定种子、可复现）；被测算法本身完全确定。
 */
'use strict';
var Braid;
try { Braid = require('./braid.js'); } catch (e) { Braid = require('../web/site/braid.js'); }

var passed = 0, failed = 0;
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   - ' + name); }
  else { failed++; console.error('  FAIL - ' + name + (detail ? ' | ' + detail : '')); }
}
function eqJson(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

console.log('[1] 业务样例');

// 样例一：四根光纤，远交换 σ1σ3 ↔ σ3σ1，两侧规范因子链必须相同
var r = Braid.compareWords(4, 'σ1 σ3', 'σ3 σ1');
check('n=4: σ1σ3 与 σ3σ1 等价', r.ok && r.equivalent);
check('n=4: 两侧规范因子链完全一致', r.ok && eqJson(r.nfA, r.nfB));

// 样例二：三项编织关系 σ1σ2σ1 ↔ σ2σ1σ2
r = Braid.compareWords(3, 'σ1 σ2 σ1', 'σ2 σ1 σ2');
check('n=3: σ1σ2σ1 与 σ2σ1σ2 等价', r.ok && r.equivalent);
check('n=3: σ1σ2σ1 归约为 Δ^1（规范链相同）', r.ok && r.nfA.delta === 1 && r.nfA.factors.length === 0 && eqJson(r.nfA, r.nfB));
r = Braid.compareWords(4, 'σ1 σ2 σ1', 'σ2 σ1 σ2');
check('n=4: σ1σ2σ1 与 σ2σ1σ2 等价', r.ok && r.equivalent && eqJson(r.nfA, r.nfB));

// 样例三：两根光纤，σ1σ1 与空记录 —— 诱导置换同为恒等，必须判不等价
r = Braid.compareWords(2, 'σ1 σ1', '');
check('n=2: σ1σ1 与空记录不等价', r.ok && !r.equivalent);
check('n=2: 两侧诱导置换均为恒等（不得据此误判）', r.ok && Braid.perms.isIdentity(r.permA) && Braid.perms.isIdentity(r.permB));
check('n=2: 首个分歧位于 Δ 指数层', r.ok && r.divergence && r.divergence.kind === 'delta');
check('n=2: σ1σ1 的规范形为 Δ^2', r.ok && r.nfA.delta === 2 && r.nfA.factors.length === 0);

console.log('[2] 逆元与混合符号');

r = Braid.compareWords(3, 'σ1 σ1^-1', '');
check('σ1σ1^-1 ≡ ε', r.ok && r.equivalent);
r = Braid.compareWords(3, 'σ1^-1 σ1', '');
check('σ1^-1σ1 ≡ ε', r.ok && r.equivalent);
r = Braid.compareWords(4, 'σ1 σ3^-1', 'σ3^-1 σ1');
check('σ1σ3^-1 ≡ σ3^-1σ1（远交换含逆元）', r.ok && r.equivalent);
r = Braid.compareWords(3, 'σ1 σ2 σ1 σ2^-1 σ1^-1 σ2^-1', '');
check('σ1σ2σ1·(σ2σ1σ2)^-1 ≡ ε', r.ok && r.equivalent);
r = Braid.compareWords(3, 'σ2^-1 σ1 σ2', 'σ1 σ2 σ1^-1');
check('σ2^-1σ1σ2 ≡ σ1σ2σ1^-1（共轭恒等式）', r.ok && r.equivalent);
r = Braid.compareWords(3, 'σ1 σ2 σ1 σ2 σ1 σ2', '');
check('Δ^2 = (σ1σ2)^3 的规范形为 Δ^2', r.ok && !r.equivalent && r.nfA.delta === 2 && r.nfA.factors.length === 0);

console.log('[3] 不等价判定与分歧定位');

r = Braid.compareWords(3, 'σ1 σ2', 'σ2 σ1');
check('n=3: σ1σ2 与 σ2σ1 不等价', r.ok && !r.equivalent);
r = Braid.compareWords(2, 'σ1', 'σ1 σ1 σ1');
check('n=2: σ1 与 σ1^3 不等价', r.ok && !r.equivalent);
r = Braid.compareWords(3, 'σ1 σ2^-1', 'σ2^-1 σ1');
check('n=3: σ1σ2^-1 与 σ2^-1σ1 不等价', r.ok && !r.equivalent);
r = Braid.compareWords(3, 'σ1', 'σ2');
check('首个分歧为第 1 个规范因子', r.ok && !r.equivalent && r.divergence.kind === 'factor' && r.divergence.index === 0);
r = Braid.compareWords(3, 'σ1', 'σ1 σ1');
check('一侧为另一侧前缀时给出链长分歧', r.ok && !r.equivalent && r.divergence.kind === 'length' && r.divergence.index === 1);

console.log('[4] 输入校验');

var p = Braid.parse('σ3', 3);
check('发生器越界被定位（符号序号）', !p.ok && p.error.type === 'range' && p.error.index === 0);
p = Braid.parse('σ1 xyz', 3);
check('非法符号被定位', !p.ok && p.error.type === 'token' && p.error.index === 1);
p = Braid.parse(new Array(82).join('σ1 ').trim(), 3);
check('超过 80 个符号被拒绝', !p.ok && p.error.type === 'length');
p = Braid.parse('', 3);
check('空记录合法（单位元）', p.ok && p.gens.length === 0);
p = Braid.parse('σ1', 7);
check('根数超出 2–6 被拒绝', !p.ok && p.error.type === 'strands');
p = Braid.parse("σ1' σ2^{-1} σ1⁻¹ s2^-1", 3);
check('多种逆元记号均可解析', p.ok && p.gens.length === 4 && p.gens.every(function (g) { return g.e === -1; }));

console.log('[5] 代数性质（固定种子伪随机用例，算法本身确定）');

var seed = 20260925;
function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
function randWord(n, len) {
  var g = [];
  for (var t = 0; t < len; t++) g.push({ i: 1 + Math.floor(rnd() * (n - 1)), e: rnd() < 0.5 ? 1 : -1 });
  return g;
}
function invert(w) { return w.slice().reverse().map(function (g) { return { i: g.i, e: -g.e }; }); }

var allOk = true, t, n;
for (t = 0; t < 150; t++) {
  n = 2 + Math.floor(rnd() * 5);
  var w = randWord(n, 1 + Math.floor(rnd() * 12));
  var nf = Braid.normalForm(n, w.concat(invert(w)));
  if (!(nf.delta === 0 && nf.factors.length === 0)) allOk = false;
}
check('150 例：w·w^-1 ≡ ε', allOk);

allOk = true;
for (t = 0; t < 120; t++) {
  n = 3 + Math.floor(rnd() * 4);
  var i = 1 + Math.floor(rnd() * (n - 2));
  var w1 = randWord(n, Math.floor(rnd() * 6));
  var w2 = randWord(n, Math.floor(rnd() * 6));
  var relA = [{ i: i, e: 1 }, { i: i + 1, e: 1 }, { i: i, e: 1 }];
  var relB = [{ i: i + 1, e: 1 }, { i: i, e: 1 }, { i: i + 1, e: 1 }];
  if (!eqJson(Braid.normalForm(n, w1.concat(relA, w2)), Braid.normalForm(n, w1.concat(relB, w2)))) allOk = false;
}
check('120 例：任意位置插入三项编织关系保持等价', allOk);

allOk = true;
for (t = 0; t < 120; t++) {
  n = 4 + Math.floor(rnd() * 3);
  var gi = 1 + Math.floor(rnd() * (n - 1));
  var gj = 1 + Math.floor(rnd() * (n - 1));
  if (Math.abs(gi - gj) < 2) gj = (gi + 2 <= n - 1) ? gi + 2 : gi - 2;
  if (gj < 1 || Math.abs(gi - gj) < 2) continue;
  var e1 = rnd() < 0.5 ? 1 : -1, e2 = rnd() < 0.5 ? 1 : -1;
  var u1 = randWord(n, Math.floor(rnd() * 5));
  var u2 = randWord(n, Math.floor(rnd() * 5));
  var a = Braid.normalForm(n, u1.concat([{ i: gi, e: e1 }, { i: gj, e: e2 }], u2));
  var b = Braid.normalForm(n, u1.concat([{ i: gj, e: e2 }, { i: gi, e: e1 }], u2));
  if (!eqJson(a, b)) allOk = false;
}
check('远交换（|i-j|≥2，含随机符号）保持等价', allOk);

console.log('[6] 规范形不变量与往返一致性');

function deltaGens(nn) { return Braid.factorWord(Braid.perms.w0(nn)).map(function (k) { return { i: k, e: 1 }; }); }
function nfToGens(nn, nf) {
  var d = deltaGens(nn), g = [];
  for (var k = 0; k < Math.abs(nf.delta); k++) g = g.concat(nf.delta > 0 ? d : invert(d));
  nf.factors.forEach(function (f) {
    g = g.concat(Braid.factorWord(f).map(function (k2) { return { i: k2, e: 1 }; }));
  });
  return g;
}

allOk = true;
for (t = 0; t < 200; t++) {
  n = 2 + Math.floor(rnd() * 5);
  var ww = randWord(n, 1 + Math.floor(rnd() * 15));
  var nf2 = Braid.normalForm(n, ww);
  var W0 = Braid.perms.w0(n);
  for (var fi = 0; fi < nf2.factors.length; fi++) {
    var f = nf2.factors[fi];
    if (Braid.perms.isIdentity(f) || Braid.perms.eqPerm(f, W0)) allOk = false;           // 真简单元
    var wp = Braid.factorWord(f).reduce(function (acc, k) {
      return Braid.perms.mul(acc, Braid.perms.genPerm(n, k));
    }, Braid.perms.idPerm(n));
    if (!Braid.perms.eqPerm(wp, f)) allOk = false;                                       // 因子字回读一致
    if (fi + 1 < nf2.factors.length) {
      var pair = Braid.normalizePair(f, nf2.factors[fi + 1]);
      if (!eqJson(pair[0], f) || !eqJson(pair[1], nf2.factors[fi + 1])) allOk = false;   // 相邻对左权重
    }
  }
  if (!eqJson(Braid.normalForm(n, nfToGens(n, nf2)), nf2)) allOk = false;                // 规范形往返幂等
  if (!eqJson(Braid.normalForm(n, ww), nf2)) allOk = false;                              // 确定性
}
check('200 例：真简单元 / 左权重 / 因子字回读 / 往返幂等 / 确定性', allOk);

console.log('[7] 长混合记录等价改写（56 符号、正负混合、n=5）');

// 业务复核用例：56 个符号、正负发生器混合；仅将中后段（第 48–50 个符号）
// σ2 σ3 σ2 改写为等价的 σ3 σ2 σ3，其余符号保持不变。
// 该改写跨越旧实现内部分段归约的边界，曾误判为不等价（Δ 指数层分歧）。
var LONG_A =
  "σ4' σ1 σ4 σ1 σ4' σ2' σ4' σ1' σ3 σ2 σ1' σ4' σ3 σ2 σ1' σ4 σ1 σ1' σ3 σ4' " +
  "σ2 σ1 σ1 σ1 σ1 σ3' σ1 σ4' σ3 σ2 σ2 σ2 σ3' σ1 σ1' σ1 σ2 σ3 σ3 σ1 σ3' σ4 " +
  "σ4 σ2 σ4 σ3' σ1' σ2 σ3 σ2 σ4' σ2 σ4 σ4 σ4 σ3";
var LONG_B =
  "σ4' σ1 σ4 σ1 σ4' σ2' σ4' σ1' σ3 σ2 σ1' σ4' σ3 σ2 σ1' σ4 σ1 σ1' σ3 σ4' " +
  "σ2 σ1 σ1 σ1 σ1 σ3' σ1 σ4' σ3 σ2 σ2 σ2 σ3' σ1 σ1' σ1 σ2 σ3 σ3 σ1 σ3' σ4 " +
  "σ4 σ2 σ4 σ3' σ1' σ3 σ2 σ3 σ4' σ2 σ4 σ4 σ4 σ3";

var lp = Braid.parse(LONG_A, 5);
check('长记录合法：56 个符号、正负混合', lp.ok && lp.gens.length === 56 &&
  lp.gens.some(function (g) { return g.e === -1; }) && lp.gens.some(function (g) { return g.e === 1; }));
check('改写子串确为 σ2σ3σ2 → σ3σ2σ3',
  eqJson(lp.gens.slice(47, 50), [{ i: 2, e: 1 }, { i: 3, e: 1 }, { i: 2, e: 1 }]) &&
  eqJson(Braid.parse(LONG_B, 5).gens.slice(47, 50), [{ i: 3, e: 1 }, { i: 2, e: 1 }, { i: 3, e: 1 }]));

r = Braid.compareWords(5, LONG_A, LONG_B);
check('长混合记录：等价改写后判定等价', r.ok && r.equivalent);
check('长混合记录：两侧规范因子链完全相同', r.ok && eqJson(r.nfA, r.nfB));
check('长混合记录：不出现首个分歧', r.ok && r.divergence === null);
check('长混合记录：规范形锚点 Δ^-3 · 15 个因子',
  r.ok && r.nfA.delta === -3 && r.nfA.factors.length === 15);
allOk = r.ok && r.nfA.factors.every(function (f, fi) {
  var W0l = Braid.perms.w0(5);
  if (Braid.perms.isIdentity(f) || Braid.perms.eqPerm(f, W0l)) return false;      // 真简单元
  if (fi + 1 >= r.nfA.factors.length) return true;
  var pair = Braid.normalizePair(f, r.nfA.factors[fi + 1]);                        // 相邻对左权重
  return eqJson(pair[0], f) && eqJson(pair[1], r.nfA.factors[fi + 1]);
});
check('长混合记录：规范链逐项为真简单元且相邻左权重', allOk);

console.log('[8] 二至六根光纤回归扫描');

allOk = true;
for (n = 2; n <= 6; n++) {
  // 混合逆元抵消
  if (!Braid.compareWords(n, 'σ1 σ1^-1', '').equivalent) allOk = false;
  if (!Braid.compareWords(n, 'σ1^-1 σ1', '').equivalent) allOk = false;
  // 三项编织关系（n ≥ 3）
  if (n >= 3 && !Braid.compareWords(n, 'σ1 σ2 σ1', 'σ2 σ1 σ2').equivalent) allOk = false;
  // 远交换（n ≥ 4，含逆元）
  if (n >= 4 && !Braid.compareWords(n, 'σ1 σ3^-1', 'σ3^-1 σ1').equivalent) allOk = false;
  // Δ 词归约为 Δ^1；同一输入两次归约结果一致（确定性）
  var nfD = Braid.normalForm(n, deltaGens(n));
  if (!(nfD.delta === 1 && nfD.factors.length === 0)) allOk = false;
  var wn = randWord(n, 20);
  if (!eqJson(Braid.normalForm(n, wn), Braid.normalForm(n, wn))) allOk = false;
}
check('n=2..6：逆元抵消 / 三项编织 / 远交换 / Δ 词 / 确定性', allOk);

console.log('[9] 同置换异辫必须判不等价（含长记录）');

r = Braid.compareWords(3, 'σ1 σ1', 'σ2 σ2');
check('n=3: σ1² 与 σ2² 诱导置换同为恒等', r.ok && Braid.perms.isIdentity(r.permA) && Braid.perms.isIdentity(r.permB));
check('n=3: σ1² 与 σ2² 判不等价且给出分歧', r.ok && !r.equivalent && r.divergence !== null);

// 长记录中把 σ2σ2 换成 σ3σ3：诱导置换不变（s2²=s3²=恒等），辫本身改变
var LONG_C =
  "σ4' σ1 σ4 σ1 σ4' σ2' σ4' σ1' σ3 σ2 σ1' σ4' σ3 σ2 σ1' σ4 σ1 σ1' σ3 σ4' " +
  "σ2 σ1 σ1 σ1 σ1 σ3' σ1 σ4' σ3 σ2 σ3 σ3 σ3' σ1 σ1' σ1 σ2 σ3 σ3 σ1 σ3' σ4 " +
  "σ4 σ2 σ4 σ3' σ1' σ2 σ3 σ2 σ4' σ2 σ4 σ4 σ4 σ3";
r = Braid.compareWords(5, LONG_A, LONG_C);
check('长记录：σ2σ2↦σ3σ3 后诱导置换仍相同', r.ok && eqJson(r.permA, r.permB));
check('长记录：同置换异辫判不等价', r.ok && !r.equivalent);
check('长记录：分歧可复算（第 3 个规范因子，重算一致）',
  r.ok && r.divergence && r.divergence.kind === 'factor' && r.divergence.index === 2 &&
  eqJson(Braid.compareWords(5, LONG_A, LONG_C).divergence, r.divergence));

console.log('[10] 80 符号边界');

// 恰 80 个符号：n=5 的 Δ 词（10 个发生器）重复 8 次 → 规范形 Δ^8
var d5 = deltaGens(5);
var w80 = [];
for (var k80 = 0; k80 < 8; k80++) w80 = w80.concat(d5);
check('Δ 词 ×8 恰为 80 个符号', w80.length === 80);
var nf80 = Braid.normalForm(5, w80);
check('80 符号全 Δ 记录归约为 Δ^8（无残余因子）', nf80.delta === 8 && nf80.factors.length === 0);

// 恰 80 个符号的混合记录：中后段改写 σ2σ3σ2 → σ3σ2σ3 仍判等价、链相同、无分歧
function padTo80(gens) { // 前置 24 个符号拼到 80：σ1σ1' 反复（恒等填充，不改变辫）
  var pad = [];
  for (var q = 0; q < 12; q++) pad.push({ i: 1, e: 1 }, { i: 1, e: -1 });
  return pad.concat(gens);
}
var gensA80 = padTo80(lp.gens);
var gensB80 = padTo80(Braid.parse(LONG_B, 5).gens);
check('填充后恰为 80 个符号', gensA80.length === 80 && gensB80.length === 80);
var nfA80 = Braid.normalForm(5, gensA80);
var nfB80 = Braid.normalForm(5, gensB80);
check('80 符号混合记录：等价改写后规范链相同', eqJson(nfA80, nfB80));
check('80 符号混合记录：与 56 符号原记录规范形一致（恒等填充无影响）', eqJson(nfA80, Braid.normalForm(5, lp.gens)));

// 长记录（56–80 符号）上的关系改写与往返一致性
allOk = true;
for (t = 0; t < 60; t++) {
  n = 5 + Math.floor(rnd() * 2);
  var pre = randWord(n, 25 + Math.floor(rnd() * 25));
  var post = randWord(n, 25 + Math.floor(rnd() * 25));
  var i2 = 1 + Math.floor(rnd() * (n - 2));
  var relP = [{ i: i2, e: 1 }, { i: i2 + 1, e: 1 }, { i: i2, e: 1 }];
  var relQ = [{ i: i2 + 1, e: 1 }, { i: i2, e: 1 }, { i: i2 + 1, e: 1 }];
  var long1 = pre.concat(relP, post);
  var long2 = pre.concat(relQ, post);
  if (long1.length > 80) { t--; continue; }
  if (!eqJson(Braid.normalForm(n, long1), Braid.normalForm(n, long2))) allOk = false;   // 三项编织
  var nfL = Braid.normalForm(n, long1);
  if (!eqJson(Braid.normalForm(n, nfToGens(n, nfL)), nfL)) allOk = false;                // 往返幂等
  if (!eqJson(Braid.normalForm(n, long1.concat(invert(long1))), Braid.normalForm(n, []))) allOk = false; // w·w^-1
}
check('60 例长记录（56–80 符号）：三项编织 / 往返幂等 / w·w^-1 ≡ ε', allOk);

p = Braid.parse(new Array(83).join('σ1 ').trim(), 3);
check('81 个符号仍被拒绝（边界外）', !p.ok && p.error.type === 'length');

console.log('');
console.log('辫群代码测试：通过 ' + passed + ' 项，失败 ' + failed + ' 项');
process.exit(failed ? 1 : 0);
