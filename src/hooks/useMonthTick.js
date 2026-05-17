import { useEffect } from 'react';
import { MS, EVTS, WEATHERS } from '../data.js';
import { fm, getPolicyMonthlyCost } from '../gameLogic.js';
import { rollCityServiceEvent } from '../game/cityEvents.js';

export function useMonthTick({
  G,
  setG,
  notif,
  recalc,
  logIdRef,
  setEvPopup,
}) {
  useEffect(() => {
    if (!G) return;
    if (G.paused || G.speed === 0 || !G.tutDone) return;

    const intervalMs = 12000 / G.speed;

    const id = setInterval(() => {
      setG(prev => {
        if (!prev?.stats) return prev;

        const s = prev.stats;
        const tax = 0.8 + prev.taxRate / 100;
        const policyCost = getPolicyMonthlyCost(prev.policies);
        const net = Math.floor(s.net * tax * (0.9 + Math.random() * 0.2)) - policyCost;

        let budget = prev.budget + net;
        let month = prev.month + 1;
        let year = prev.year;

        if (month > 12) {
          month = 1;
          year++;
        }

        let elTmr = prev.elTmr - 1;
        let auditCD = Math.max(0, prev.auditCD - 1);
        let serviceEventCD = Math.max(0, (prev.serviceEventCD || 0) - 1);

        const newLog = [
          {
            id: logIdRef.current++,
            label: `📅 ${MS[prev.month - 1]} Rok ${prev.year}`,
            amount: net,
          },
          ...prev.log.slice(0, 19),
        ];

        if (policyCost > 0) {
          newLog.unshift({
            id: logIdRef.current++,
            label: '📋 Koszty polityk miejskich',
            amount: -policyCost,
          });
        }

        if (elTmr <= 0) {
          elTmr = 48;

          const avg = Math.round(Object.values(s.sat).reduce((a, b) => a + b, 0) / 5);

          if (avg >= 45) {
            budget += 2000;
            notif('🗳️ Wygrałeś wybory! +2000 zł', 'ok');
          } else {
            budget -= 5000;
            notif('🗳️ Przegrałeś wybory! -5000 zł', 'err');
          }
        }

        let weather = prev.weather;

        if (month % 3 === 0) {
          const r = Math.random();

          weather = r < 0.5
            ? WEATHERS[0]
            : r < 0.75
              ? WEATHERS[1]
              : r < 0.9
                ? WEATHERS[2]
                : WEATHERS[3];

          if (weather.id !== 'sunny') {
            notif(`${weather.icon} Pogoda: ${weather.name}`, 'warn');
          }
        }

        let events = prev.events;
        let news = prev.news;

        if (Math.random() < 0.1) {
          const ev = EVTS[Math.floor(Math.random() * EVTS.length)];

          budget += ev.b;

          events = [
            {
              id: logIdRef.current++,
              t: ev.t,
              tp: ev.tp,
              mo: month,
              yr: year,
            },
            ...events.slice(0, 9),
          ];

          news = [
            {
              id: logIdRef.current++,
              t: ev.t,
              m: ev.m,
              tp: ev.tp,
            },
            ...news.slice(0, 4),
          ];

          newLog.unshift({
            id: logIdRef.current++,
            label: ev.t,
            amount: ev.b,
          });

          setEvPopup(ev);
          setTimeout(() => setEvPopup(null), 5000);
        }

        const serviceEvent = rollCityServiceEvent(
          {
            ...prev,
            month,
            year,
            weather,
            serviceEventCD,
          },
          s
        );

        if (serviceEvent) {
          budget += serviceEvent.b;
          serviceEventCD = serviceEvent.cooldown || 4;

          events = [
            {
              id: logIdRef.current++,
              t: serviceEvent.t,
              tp: serviceEvent.tp,
              mo: month,
              yr: year,
            },
            ...events.slice(0, 9),
          ];

          news = [
            {
              id: logIdRef.current++,
              t: serviceEvent.t,
              m: serviceEvent.m,
              tp: serviceEvent.tp,
            },
            ...news.slice(0, 4),
          ];

          newLog.unshift({
            id: logIdRef.current++,
            label: serviceEvent.t,
            amount: serviceEvent.b,
          });

          notif(
            `${serviceEvent.t} ${fm(serviceEvent.b)} zł`,
            serviceEvent.tp === 'ok' ? 'ok' : 'err'
          );

          setEvPopup(serviceEvent);
          setTimeout(() => setEvPopup(null), 5000);
        }

        let riotOn = prev.riotOn;
        let riotTmr = prev.riotTmr;

        const avg2 = Math.round(Object.values(s.sat).reduce((a, b) => a + b, 0) / 5);
        const hasPolice = prev.buildings.some(b => b.type === 'police' && !b.building);

        if (!riotOn && avg2 < 35 && !hasPolice && Math.random() < 0.05) {
          riotOn = true;
          riotTmr = 3;
          budget -= 2000;

          notif('🚨 ZAMIESZKI! -2000 zł', 'err');

          newLog.unshift({
            id: logIdRef.current++,
            label: '🚨 Zamieszki',
            amount: -2000,
          });
        }

        if (riotOn) {
          riotTmr--;

          if (riotTmr <= 0) {
            riotOn = false;
          }
        }

        let loan = prev.loan;

        if (loan) {
          loan = {
            ...loan,
            months: loan.months - 1,
          };

          if (loan.months <= 0) {
            loan = null;
            notif('✅ Pożyczka spłacona!', 'ok');
          }
        }

        return recalc({
          ...prev,
          budget,
          log: newLog,
          month,
          year,
          elTmr,
          auditCD,
          serviceEventCD,
          weather,
          events,
          news,
          riotOn,
          riotTmr,
          loan,
        });
      });
    }, intervalMs);

    return () => clearInterval(id);
  }, [
    G?.paused,
    G?.speed,
    G?.tutDone,
    setG,
    notif,
    recalc,
    logIdRef,
    setEvPopup,
  ]);
}