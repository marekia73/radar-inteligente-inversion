import React, { useState, useEffect } from 'react';
import { WarningBanner } from '../ui/WarningBanner';

const QUESTIONS = [
  {
    question: "¿Qué edad tienes?",
    options: [
      { text: "Más de 60 años", points: 0 },
      { text: "Entre 45 y 60 años", points: 3 },
      { text: "Entre 30 y 45 años", points: 7 },
      { text: "Menos de 30 años", points: 10 }
    ]
  },
  {
    question: "¿Cuál es tu horizonte temporal principal para esta inversión?",
    options: [
      { text: "Menos de 2 años (puedo necesitar el dinero en cualquier momento)", points: 0 },
      { text: "Entre 3 y 5 años", points: 3 },
      { text: "Entre 6 y 10 años", points: 7 },
      { text: "Más de 10 años", points: 12 }
    ]
  },
  {
    question: "Si tu cartera de inversión cae un 20% en un mes debido a una crisis global, ¿qué harías?",
    options: [
      { text: "Vendería todo inmediatamente para no perder más", points: 0 },
      { text: "Vendería una parte y esperaría a que se estabilice", points: 2 },
      { text: "No haría nada y esperaría, sé que los mercados se recuperan", points: 7 },
      { text: "Aprovecharía para comprar más (está barato)", points: 12 }
    ]
  },
  {
    question: "¿Cuál es tu conocimiento sobre productos financieros (acciones, ETFs, bonos)?",
    options: [
      { text: "Nulo. Solo conozco cuentas de ahorro y plazos fijos", points: 0 },
      { text: "Básico. Conozco qué son las acciones y fondos, pero no tengo experiencia", points: 3 },
      { text: "Medio. Entiendo el concepto de diversificación y he invertido antes", points: 7 },
      { text: "Alto. Sigo el mercado, entiendo la volatilidad y opero con frecuencia", points: 10 }
    ]
  },
  {
    question: "¿Qué porcentaje de tu patrimonio/ahorros totales representa esta inversión?",
    options: [
      { text: "Más del 75%. Es casi todo mi dinero.", points: 0 },
      { text: "Alrededor del 50%", points: 3 },
      { text: "Alrededor del 25%", points: 6 },
      { text: "Menos del 10%. Es un dinero que me sobra y no necesito.", points: 8 }
    ]
  },
  {
    question: "Tus ingresos mensuales son...",
    options: [
      { text: "Inestables e inciertos (ingresos muy variables sin fondo de emergencia)", points: 0 },
      { text: "Suficientes pero sin margen de ahorro", points: 2 },
      { text: "Estables y me permiten un pequeño ahorro mensual", points: 6 },
      { text: "Muy seguros y me permiten ahorrar cómodamente cada mes", points: 8 }
    ]
  },
  {
    question: "¿Cuál es tu objetivo principal con esta inversión?",
    options: [
      { text: "Proteger mi dinero de la inflación sin riesgo de perder capital", points: 0 },
      { text: "Obtener un poco de rentabilidad asumiendo el mínimo riesgo posible", points: 3 },
      { text: "Hacer crecer mi capital a largo plazo, asumiendo caídas ocasionales", points: 7 },
      { text: "Maximizar rentabilidad, aunque implique alta volatilidad y riesgo de pérdida", points: 10 }
    ]
  },
  {
    question: "¿Cómo reaccionas ante la idea de perder temporalmente parte de tu inversión inicial?",
    options: [
      { text: "Dormiría intranquilo, no lo soporto", points: 0 },
      { text: "Me preocuparía bastante, revisaría mi cartera todos los días", points: 2 },
      { text: "Lo entiendo como parte del proceso, pero prefiero caídas moderadas", points: 6 },
      { text: "No me importa, la volatilidad es el precio de las altas rentabilidades", points: 8 }
    ]
  },
  {
    question: "¿Qué prefieres: seguridad o rentabilidad?",
    options: [
      { text: "100% Seguridad, prefiero ganar muy poco pero no perder", points: 0 },
      { text: "Seguridad ante todo, pero con algo de rentabilidad", points: 3 },
      { text: "Equilibrio entre crecimiento y seguridad", points: 6 },
      { text: "100% Rentabilidad, busco maximizar asumiendo riesgos", points: 8 }
    ]
  },
  {
    question: "¿Alguna vez pedirías dinero prestado (apalancamiento) para invertir?",
    options: [
      { text: "Nunca, me parece una locura total", points: 0 },
      { text: "No lo creo, prefiero invertir solo mi propio dinero ahorrado", points: 2 },
      { text: "Solo si estoy muy seguro y el interés es bajo", points: 5 },
      { text: "Sí, es una herramienta válida para multiplicar ganancias", points: 8 }
    ]
  },
  {
    question: "¿Si te ofrecen una inversión nueva que promete un 20% anual garantizado, qué piensas?",
    options: [
      { text: "Invirtiría la mayor parte de mi dinero, es una oportunidad única", points: 0 }, // Trampa
      { text: "Invirtiría una pequeña cantidad a ver si es cierto", points: 1 },
      { text: "Suena bien, investigaría, pero con mucha desconfianza", points: 3 },
      { text: "Es una estafa, lo descarto inmediatamente", points: 5 } // Correcta educativa
    ]
  },
  {
    question: "Frente a acciones individuales vs. ETFs diversificados globales, ¿qué prefieres?",
    options: [
      { text: "No invertiría en ninguno de los dos, prefiero depósitos seguros", points: 0 },
      { text: "ETFs globales diversificados, no quiero complicarme", points: 3 },
      { text: "Una mezcla de fondos indexados y algunas acciones que me gustan", points: 6 },
      { text: "Acciones individuales, me gusta elegirlas y buscar grandes empresas", points: 8 }
    ]
  },
  {
    question: "¿Tienes un fondo de emergencia (dinero líquido para un imprevisto sin tener que vender tus inversiones)?",
    options: [
      { text: "No tengo nada apartado para imprevistos", points: 0 },
      { text: "Sí, pero solo para cubrir unos pocos meses", points: 2 },
      { text: "Sí, cubro entre 3 y 6 meses de mis gastos", points: 5 },
      { text: "Sí, mis gastos básicos están cubiertos durante más de 6 meses", points: 8 }
    ]
  },
  {
    question: "¿Para qué te gustaría inspirarte con las ideas de figuras representadas educativamente aquí (como Pablo, Andrea...)?",
    options: [
      { text: "Para saber buscar los productos más conservadores y blindar mis ahorros", points: 0 },
      { text: "Para crear poco a poco una cartera sólida y aburrida a largo plazo", points: 3 },
      { text: "Para entender bien los ciclos económicos y mantener el equilibrio", points: 6 },
      { text: "Para buscar el momento exacto, hacer rotación constante o tratar de batir siempre al mercado", points: 8 }
    ]
  }
];

export const InvestorProfileTest: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [savedResult, setSavedResult] = useState<{score: number, date: string} | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('investor_profile_score');
    if (saved) {
      try {
        setSavedResult(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleAnswer = (points: number) => {
    const newScore = score + points;
    if (currentQuestion < QUESTIONS.length - 1) {
      setScore(newScore);
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishTest(newScore);
    }
  };

  const finishTest = (finalScore: number) => {
    const maxPoints = QUESTIONS.reduce((acc, q) => acc + Math.max(...q.options.map(o => o.points)), 0);
    const normalizedScore = Math.min(100, Math.round((finalScore / maxPoints) * 100));
    
    setScore(normalizedScore);
    setIsFinished(true);
    
    const resultToSave = { score: normalizedScore, date: new Date().toISOString() };
    localStorage.setItem('investor_profile_score', JSON.stringify(resultToSave));
    window.dispatchEvent(new Event('storage'));
    setSavedResult(resultToSave);
  };

  const resetTest = () => {
    setCurrentQuestion(0);
    setScore(0);
    setIsFinished(false);
  };

  const getProfileInfo = (s: number) => {
    if (s <= 20) return {
      name: "Muy Conservador",
      desc: "Tu prioridad máxima es proteger tu capital. No te sientes cómodo con la volatilidad y necesitas disponibilidad total de tu dinero o tienes miedo a las pérdidas. Este perfil asume un riesgo: que la inflación vaya reduciendo el poder adquisitivo de sus ahorros poco a poco.",
      assets: "Depósitos bancarios, cuentas remuneradas, renta fija gubernamental a muy corto plazo, fondos monetarios europeos.",
      errors: "Dejarse llevar y comprar productos prometedores de alta ganancia sin entenderlos; invertir en renta variable con dinero que se necesita a corto plazo."
    };
    if (s <= 40) return {
      name: "Conservador",
      desc: "Buscas algo más de rentabilidad que un simple depósito bancario, pero tu prioridad sigue siendo limitar las pérdidas. Estás dispuesto a asumir pequeñas caídas temporales, pero no toleras grandes fluctuaciones en tu cartera.",
      assets: "Carteras compuestas mayormente por renta fija diversificada, junto con un porcentaje muy pequeño de renta variable a largo plazo.",
      errors: "No diversificar; asustarse y vender todo ante pequeñas correcciones del mercado global y no dar tiempo a la maduración constante."
    };
    if (s <= 60) return {
      name: "Moderado",
      desc: "Entiendes que para lograr rentabilidades mayores debes asumir cierto nivel de riesgo y volatilidad. Tienes un horizonte temporal que te permite soportar ciclos bajistas sin tener que vender por pánico. Buscas un equilibrio cuerdo.",
      assets: "Carteras equilibradas estilo 60% renta variable / 40% renta fija utilizando fondos indexados o ETFs diversificados globales.",
      errors: "Intentar predecir el mercado en el corto plazo (market timing); tener acciones individuales demasiado concentradas en un solo sector."
    };
    if (s <= 80) return {
      name: "Dinámico",
      desc: "Tienes un horizonte a largo plazo, experiencia o estómago suficiente para aguantar la volatilidad severa de los mercados. Tu meta principal es el crecimiento del capital y no dependes de este dinero invertido en un corto o medio plazo.",
      assets: "Alta exposición a renta variable global (fondos/ETFs internacionales como MSCI World, S&P 500) y posibilidad de tener un pequeño satélite de acciones corporativas.",
      errors: "Creer que más riesgo es igual a más rentabilidad obligatoria. Invertir capital vital por avaricia olvidando el riesgo de caída grave o de liquidez prolongada."
    };
    return {
      name: "Agresivo",
      desc: "Tu horizonte es al fin y al cabo a muy largo plazo, o tu tolerancia al riesgo es extremadamente estoica. Conoces perfectamente que tu cartera puede caer un 40% y mantendrías la calma, incluso aprovecharías para comprar más. Buscas maximizar absolutamente los retornos.",
      assets: "Casi 100% de la cartera en renta variable agresiva o growth, apuestas sectoriales, empresas en etapas disruptivas e inversiones puramente direccionales agresivas.",
      errors: "Usar deuda o apalancamiento sin controlar los riesgos marginados; no usar fondos de emergencia; concentrar y arriesgar todo en una única idea fallida sin stop loss y protección de caídas."
    };
  };

  if (!isFinished && savedResult) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-3xl mx-auto shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4">Ya realizaste tu simulación de perfil</h2>
        <p className="text-slate-400 mb-6">Tu último resultado fue guardado el {new Date(savedResult.date).toLocaleDateString()}.</p>
        
        {(() => {
          const info = getProfileInfo(savedResult.score);
          return (
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 mb-8 text-left">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 border-emerald-500 bg-slate-900 shrink-0 relative">
                  <span className="text-3xl font-extrabold text-white">{savedResult.score}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">/ 100 PTS</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-400 mb-2">{info.name}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{info.desc}</p>
                </div>
              </div>
            </div>
          );
        })()}

        <button 
          onClick={() => {
            localStorage.removeItem('investor_profile_score');
            window.dispatchEvent(new Event('storage'));
            setSavedResult(null);
            resetTest();
          }}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors border border-emerald-500 shadow-lg shadow-emerald-500/20"
        >
          Repetir el Test Evaluativo
        </button>
      </div>
    );
  }

  if (isFinished) {
    const info = getProfileInfo(score);
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-10 shadow-xl max-w-4xl mx-auto">
        <WarningBanner 
            type="warning"
            message="HERRAMIENTA EDUCATIVA: Este resultado es una simple orientación didáctica genérica. No constituye un test de idoneidad legal y no es asesoramiento para tomar determinaciones financieras vinculantes."
        />
        
        <div className="mt-8 flex flex-col md:flex-row items-center gap-8 mb-10">
          <div className="flex flex-col items-center justify-center w-36 h-36 rounded-full border-4 border-emerald-500 bg-slate-800 shrink-0 relative shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]">
            <span className="text-5xl font-extrabold text-white">{score}</span>
            <span className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">/ 100</span>
          </div>
          <div className="flex-1">
            <h4 className="text-slate-500 uppercase font-bold text-[10px] tracking-widest mb-1">Perfil Inversor Teórico</h4>
            <h2 className="text-3xl font-extrabold text-emerald-400 mb-3">{info.name}</h2>
            <div className="w-full bg-slate-800 h-2.5 rounded-full mb-5 overflow-hidden border border-slate-700">
               <div className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 to-rose-500" style={{ width: `${score}%` }}></div>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm">{info.desc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-emerald-950/20 p-6 rounded-2xl border border-emerald-900/30">
            <h3 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/20 rounded-md">💡</span> Activos Educativos Compatibles
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              {info.assets}
            </p>
          </div>
          <div className="bg-rose-950/20 p-6 rounded-2xl border border-rose-900/30">
            <h3 className="text-rose-400 font-bold mb-3 flex items-center gap-2">
              <span className="p-1.5 bg-rose-500/20 rounded-md">⚠️</span> Errores frecuentes a evitar
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {info.errors}
            </p>
          </div>
        </div>

        <div className="text-center pt-4 border-t border-slate-800">
          <button 
            onClick={resetTest}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors border border-slate-700 shadow-lg"
          >
            Rehacer Test
          </button>
        </div>
      </div>
    );
  }

  const question = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion) / QUESTIONS.length) * 100;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-10 max-w-3xl mx-auto shadow-2xl">
      
      <div className="flex justify-between text-xs text-slate-500 font-bold mb-3 uppercase tracking-wide">
        <span>Pregunta {currentQuestion + 1} de {QUESTIONS.length}</span>
        <span className="text-emerald-500">{Math.round(progress)}% Completado</span>
      </div>
      
      <div className="w-full bg-slate-800 h-2 rounded-full mb-8 overflow-hidden">
        <div className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${progress}%` }}></div>
      </div>

      <h2 className="text-2xl font-extrabold text-white mb-8 leading-snug">{question.question}</h2>

      <div className="space-y-3">
        {question.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(opt.points)}
            className="w-full text-left p-4 rounded-xl border border-slate-700 bg-slate-800/40 hover:bg-slate-800 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all text-slate-200 group"
          >
            <div className="flex items-start gap-4">
              <div className="mt-0.5 min-w-[26px] h-[26px] rounded-full border border-slate-600 group-hover:border-emerald-500 flex items-center justify-center text-xs text-slate-400 group-hover:text-emerald-400 font-bold transition-colors">
                {String.fromCharCode(65 + idx)}
              </div>
              <span className="leading-tight font-medium pt-0.5">{opt.text}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
