interface FAQItem {
  question: string;
  answer: string;
}

interface FAQsByLanguage {
  en: FAQItem[];
  es: FAQItem[];
  pl: FAQItem[];
}

export const mortgageFAQs: FAQsByLanguage = {
  en: [
    {
      question: "What is a mortgage calculator and how does it work?",
      answer: "A mortgage calculator is a digital tool that helps you estimate your monthly mortgage payments based on various inputs such as loan amount, interest rate, loan term, and other factors. It works by applying mathematical formulas to calculate amortization schedules, showing how your payments are divided between principal and interest over time, and providing insights into the total cost of your loan."
    },
    {
      question: "How accurate are mortgage calculators?",
      answer: "Mortgage calculators provide reasonably accurate estimates when you input correct information. However, they may not account for all variables that affect your actual mortgage payment, such as property taxes, homeowners insurance, HOA fees, or private mortgage insurance (PMI). Our calculator includes options for these additional costs to provide a more comprehensive estimate."
    },
    {
      question: "What is the difference between fixed-rate and adjustable-rate mortgages?",
      answer: "A fixed-rate mortgage maintains the same interest rate throughout the entire loan term, resulting in consistent monthly payments. An adjustable-rate mortgage (ARM) has an interest rate that changes periodically based on market conditions, typically after an initial fixed period. Our calculator allows you to model both types by setting different interest rate periods."
    },
    {
      question: "How do overpayments affect my mortgage?",
      answer: "Overpayments reduce your mortgage principal faster than scheduled payments, which can significantly reduce the total interest paid and shorten your loan term. Our calculator allows you to see the impact of different overpayment strategies, including one-time lump sums or regular monthly additional payments."
    },
    {
      question: "What is amortization and why is it important?",
      answer: "Amortization is the process of gradually paying off your mortgage through regular payments that cover both principal and interest. Early in the loan, a larger portion of each payment goes toward interest, while later payments primarily reduce the principal. Understanding your amortization schedule helps you see how your debt decreases over time and how strategies like overpayments can accelerate your path to ownership."
    },
    {
      question: "How does the loan term affect my mortgage payments?",
      answer: "The loan term (duration) significantly impacts both your monthly payment amount and the total interest paid over the life of the loan. Shorter terms (like 15 years) have higher monthly payments but much lower total interest costs compared to longer terms (like 30 years). Our calculator allows you to compare different loan terms to find the right balance for your financial situation."
    },
    {
      question: "What is APR and how does it differ from the interest rate?",
      answer: "Annual Percentage Rate (APR) represents the total cost of borrowing, including the interest rate plus additional fees and costs associated with the loan, expressed as a yearly percentage. While the interest rate only reflects the cost of borrowing the principal, APR provides a more comprehensive view by including origination fees, mortgage insurance, and other costs. Our calculator can help you understand the impact of these additional costs."
    },
    {
      question: "How can I reduce the total cost of my mortgage?",
      answer: "Several strategies can reduce your mortgage costs: making a larger down payment, securing a lower interest rate, choosing a shorter loan term, making regular overpayments, refinancing when rates drop, or eliminating private mortgage insurance as soon as possible. Our calculator's comparison feature allows you to model different scenarios to find the most cost-effective approach for your situation."
    },
    {
      question: "What is the difference between equal installments and decreasing installments?",
      answer: "With equal installments (also called annuity), your total monthly payment remains the same throughout the loan term, but the proportion of principal and interest changes over time. With decreasing installments, you pay a fixed amount toward the principal each month, while the interest portion decreases over time, resulting in gradually decreasing total payments. Our calculator supports both repayment models so you can compare their impact."
    },
    {
      question: "How do interest rate changes affect my mortgage?",
      answer: "Even small changes in interest rates can significantly impact your monthly payments and the total cost of your mortgage. A 1% reduction in rate on a 30-year $300,000 mortgage could save over $60,000 in total interest. Our calculator allows you to model different interest rate scenarios and see their long-term effects on your loan."
    }
  ],
  es: [
    {
      question: "¿Qué es una calculadora hipotecaria y cómo funciona?",
      answer: "Una calculadora hipotecaria es una herramienta digital que te ayuda a estimar tus pagos mensuales de hipoteca basándose en varios datos como el monto del préstamo, la tasa de interés, el plazo del préstamo y otros factores. Funciona aplicando fórmulas matemáticas para calcular programas de amortización, mostrando cómo tus pagos se dividen entre capital e intereses a lo largo del tiempo, y proporcionando información sobre el costo total de tu préstamo."
    },
    {
      question: "¿Qué tan precisas son las calculadoras hipotecarias?",
      answer: "Las calculadoras hipotecarias proporcionan estimaciones razonablemente precisas cuando ingresas información correcta. Sin embargo, es posible que no tengan en cuenta todas las variables que afectan tu pago hipotecario real, como impuestos sobre la propiedad, seguro de vivienda, tarifas de la asociación de propietarios o seguro hipotecario privado (PMI). Nuestra calculadora incluye opciones para estos costos adicionales para proporcionar una estimación más completa."
    },
    {
      question: "¿Cuál es la diferencia entre hipotecas de tasa fija y de tasa ajustable?",
      answer: "Una hipoteca de tasa fija mantiene la misma tasa de interés durante todo el plazo del préstamo, lo que resulta en pagos mensuales constantes. Una hipoteca de tasa ajustable (ARM) tiene una tasa de interés que cambia periódicamente según las condiciones del mercado, típicamente después de un período fijo inicial. Nuestra calculadora te permite modelar ambos tipos estableciendo diferentes períodos de tasa de interés."
    },
    {
      question: "¿Cómo afectan los pagos adicionales a mi hipoteca?",
      answer: "Los pagos adicionales reducen el capital de tu hipoteca más rápido que los pagos programados, lo que puede reducir significativamente el interés total pagado y acortar el plazo de tu préstamo. Nuestra calculadora te permite ver el impacto de diferentes estrategias de pago adicional, incluyendo sumas únicas o pagos mensuales adicionales regulares."
    },
    {
      question: "¿Qué es la amortización y por qué es importante?",
      answer: "La amortización es el proceso de pagar gradualmente tu hipoteca a través de pagos regulares que cubren tanto el capital como los intereses. Al principio del préstamo, una mayor parte de cada pago va hacia los intereses, mientras que los pagos posteriores reducen principalmente el capital. Entender tu programa de amortización te ayuda a ver cómo disminuye tu deuda con el tiempo y cómo estrategias como los pagos adicionales pueden acelerar tu camino hacia la propiedad."
    },
    {
      question: "¿Cómo afecta el plazo del préstamo a mis pagos hipotecarios?",
      answer: "El plazo del préstamo (duración) impacta significativamente tanto en la cantidad de tu pago mensual como en el interés total pagado durante la vida del préstamo. Los plazos más cortos (como 15 años) tienen pagos mensuales más altos pero costos de interés total mucho más bajos en comparación con plazos más largos (como 30 años). Nuestra calculadora te permite comparar diferentes plazos de préstamo para encontrar el equilibrio adecuado para tu situación financiera."
    },
    {
      question: "¿Qué es la TAE y cómo difiere de la tasa de interés?",
      answer: "La Tasa Anual Equivalente (TAE) representa el costo total del préstamo, incluyendo la tasa de interés más tarifas adicionales y costos asociados con el préstamo, expresado como un porcentaje anual. Mientras que la tasa de interés solo refleja el costo de pedir prestado el capital, la TAE proporciona una visión más completa al incluir tarifas de originación, seguro hipotecario y otros costos. Nuestra calculadora puede ayudarte a entender el impacto de estos costos adicionales."
    },
    {
      question: "¿Cómo puedo reducir el costo total de mi hipoteca?",
      answer: "Varias estrategias pueden reducir tus costos hipotecarios: hacer un pago inicial más grande, asegurar una tasa de interés más baja, elegir un plazo de préstamo más corto, hacer pagos adicionales regulares, refinanciar cuando las tasas bajen, o eliminar el seguro hipotecario privado tan pronto como sea posible. La función de comparación de nuestra calculadora te permite modelar diferentes escenarios para encontrar el enfoque más rentable para tu situación."
    },
    {
      question: "¿Cuál es la diferencia entre cuotas iguales y cuotas decrecientes?",
      answer: "Con cuotas iguales (también llamadas anualidad), tu pago mensual total permanece igual durante todo el plazo del préstamo, pero la proporción de capital e intereses cambia con el tiempo. Con cuotas decrecientes, pagas una cantidad fija hacia el capital cada mes, mientras que la porción de interés disminuye con el tiempo, resultando en pagos totales gradualmente decrecientes. Nuestra calculadora soporta ambos modelos de pago para que puedas comparar su impacto."
    },
    {
      question: "¿Cómo afectan los cambios en la tasa de interés a mi hipoteca?",
      answer: "Incluso pequeños cambios en las tasas de interés pueden impactar significativamente tus pagos mensuales y el costo total de tu hipoteca. Una reducción del 1% en la tasa de una hipoteca de $300,000 a 30 años podría ahorrar más de $60,000 en interés total. Nuestra calculadora te permite modelar diferentes escenarios de tasas de interés y ver sus efectos a largo plazo en tu préstamo."
    }
  ],
  pl: [
    {
      question: "Czym jest kalkulator kredytu hipotecznego i jak działa?",
      answer: "Kalkulator kredytu hipotecznego to narzędzie cyfrowe, które pomaga oszacować miesięczne raty kredytu hipotecznego na podstawie różnych danych, takich jak kwota kredytu, stopa procentowa, okres kredytowania i inne czynniki. Działa poprzez zastosowanie formuł matematycznych do obliczenia harmonogramów amortyzacji, pokazując, jak płatności są podzielone między kapitał i odsetki w czasie, oraz dostarczając informacji o całkowitym koszcie kredytu."
    },
    {
      question: "Jak dokładne są kalkulatory kredytów hipotecznych?",
      answer: "Kalkulatory kredytów hipotecznych dostarczają dość dokładnych szacunków, gdy wprowadzasz poprawne informacje. Jednak mogą nie uwzględniać wszystkich zmiennych, które wpływają na rzeczywistą ratę kredytu hipotecznego, takich jak podatki od nieruchomości, ubezpieczenie domu, opłaty wspólnotowe czy prywatne ubezpieczenie hipoteczne (PMI). Nasz kalkulator zawiera opcje dla tych dodatkowych kosztów, aby zapewnić bardziej kompleksowe oszacowanie."
    },
    {
      question: "Jaka jest różnica między kredytami hipotecznymi o stałym i zmiennym oprocentowaniu?",
      answer: "Kredyt hipoteczny o stałym oprocentowaniu utrzymuje tę samą stopę procentową przez cały okres kredytowania, co skutkuje stałymi miesięcznymi płatnościami. Kredyt hipoteczny o zmiennym oprocentowaniu (ARM) ma stopę procentową, która zmienia się okresowo w zależności od warunków rynkowych, zazwyczaj po początkowym okresie stałym. Nasz kalkulator pozwala modelować oba typy poprzez ustawienie różnych okresów stopy procentowej."
    },
    {
      question: "Jak nadpłaty wpływają na mój kredyt hipoteczny?",
      answer: "Nadpłaty zmniejszają kapitał kredytu hipotecznego szybciej niż zaplanowane płatności, co może znacznie zmniejszyć całkowite odsetki i skrócić okres kredytowania. Nasz kalkulator pozwala zobaczyć wpływ różnych strategii nadpłat, w tym jednorazowych kwot ryczałtowych lub regularnych dodatkowych płatności miesięcznych."
    },
    {
      question: "Czym jest amortyzacja i dlaczego jest ważna?",
      answer: "Amortyzacja to proces stopniowej spłaty kredytu hipotecznego poprzez regularne płatności, które pokrywają zarówno kapitał, jak i odsetki. Na początku kredytu większa część każdej płatności jest przeznaczana na odsetki, podczas gdy późniejsze płatności głównie zmniejszają kapitał. Zrozumienie harmonogramu amortyzacji pomaga zobaczyć, jak zadłużenie zmniejsza się w czasie i jak strategie takie jak nadpłaty mogą przyspieszyć drogę do własności."
    },
    {
      question: "Jak okres kredytowania wpływa na moje raty kredytu hipotecznego?",
      answer: "Okres kredytowania (czas trwania) znacząco wpływa zarówno na wysokość miesięcznej raty, jak i na całkowite odsetki zapłacone w okresie kredytu. Krótsze okresy (jak 15 lat) mają wyższe miesięczne raty, ale znacznie niższe całkowite koszty odsetek w porównaniu z dłuższymi okresami (jak 30 lat). Nasz kalkulator pozwala porównać różne okresy kredytowania, aby znaleźć odpowiednią równowagę dla Twojej sytuacji finansowej."
    },
    {
      question: "Czym jest RRSO i jak różni się od stopy procentowej?",
      answer: "Rzeczywista Roczna Stopa Oprocentowania (RRSO) reprezentuje całkowity koszt pożyczki, w tym stopę procentową plus dodatkowe opłaty i koszty związane z kredytem, wyrażone jako roczny procent. Podczas gdy stopa procentowa odzwierciedla tylko koszt pożyczenia kapitału, RRSO zapewnia bardziej kompleksowy widok, uwzględniając opłaty za udzielenie kredytu, ubezpieczenie hipoteczne i inne koszty. Nasz kalkulator może pomóc zrozumieć wpływ tych dodatkowych kosztów."
    },
    {
      question: "Jak mogę zmniejszyć całkowity koszt mojego kredytu hipotecznego?",
      answer: "Kilka strategii może zmniejszyć koszty kredytu hipotecznego: dokonanie większej wpłaty początkowej, zabezpieczenie niższej stopy procentowej, wybór krótszego okresu kredytowania, dokonywanie regularnych nadpłat, refinansowanie gdy stopy spadają lub wyeliminowanie prywatnego ubezpieczenia hipotecznego tak szybko, jak to możliwe. Funkcja porównania naszego kalkulatora pozwala modelować różne scenariusze, aby znaleźć najbardziej opłacalne podejście dla Twojej sytuacji."
    },
    {
      question: "Jaka jest różnica między równymi ratami a malejącymi ratami?",
      answer: "Przy równych ratach (zwanych również annuitetowymi) całkowita miesięczna płatność pozostaje taka sama przez cały okres kredytowania, ale proporcja kapitału i odsetek zmienia się w czasie. Przy malejących ratach płacisz stałą kwotę na poczet kapitału każdego miesiąca, podczas gdy część odsetkowa zmniejsza się w czasie, co skutkuje stopniowo malejącymi płatnościami całkowitymi. Nasz kalkulator obsługuje oba modele spłaty, dzięki czemu możesz porównać ich wpływ."
    },
    {
      question: "Jak zmiany stopy procentowej wpływają na mój kredyt hipoteczny?",
      answer: "Nawet małe zmiany stóp procentowych mogą znacząco wpłynąć na miesięczne płatności i całkowity koszt kredytu hipotecznego. Obniżenie stopy o 1% w przypadku 30-letniego kredytu hipotecznego na 300 000 zł może zaoszczędzić ponad 60 000 zł na całkowitych odsetkach. Nasz kalkulator pozwala modelować różne scenariusze stóp procentowych i zobaczyć ich długoterminowe skutki dla Twojego kredytu."
    }
  ]
};