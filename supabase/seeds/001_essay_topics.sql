-- ============================================================
-- Seed 001 — Temas de redação ENEM de exemplo
--
-- Como aplicar:
--   Execute no SQL Editor do Supabase Dashboard.
--   O SQL Editor usa service_role, que bypassa RLS —
--   portanto não é necessário ter role = 'admin' no seu perfil.
--
-- Idempotente: ON CONFLICT (id) DO NOTHING.
--   Rode quantas vezes quiser sem duplicar dados.
--
-- Atenção: exige que a migration 011 já esteja aplicada.
-- ============================================================

insert into public.essay_topics
  (id, title, year, description, is_free, active, motivational_texts)
values
  (
    'a1000000-0000-0000-0000-000000000001',
    'O estigma associado às doenças mentais na sociedade brasileira',
    2020,
    'Debate sobre preconceito, exclusão social e os desafios no acesso ao tratamento de saúde mental no Brasil.',
    true,
    true,
    '[
      {"type": "text", "source": "Adaptado de: OMS, 2019", "content": "Segundo a Organização Mundial da Saúde, cerca de 450 milhões de pessoas sofrem de algum transtorno mental no mundo. No Brasil, o estigma em torno dessas condições ainda representa um dos maiores obstáculos ao tratamento adequado."},
      {"type": "text", "source": "Adaptado de: Conselho Federal de Medicina, 2020", "content": "O preconceito contra pessoas com transtornos mentais se manifesta em diversas esferas sociais — do mercado de trabalho às relações familiares —, resultando em isolamento e piora do quadro clínico."}
    ]'::jsonb
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'Invisibilidade e registro civil: garantia de acesso à cidadania no Brasil',
    2021,
    'Reflexão sobre como a ausência de documentação priva cidadãos de direitos fundamentais e perpetua desigualdades.',
    true,
    true,
    '[
      {"type": "text", "source": "Adaptado de: IBGE, 2020", "content": "Cerca de 3 milhões de brasileiros não possuem registro de nascimento, concentrados principalmente em regiões remotas e entre populações vulneráveis."},
      {"type": "text", "source": "Adaptado de: Constituição Federal, 1988", "content": "O registro civil é um direito fundamental. Sem ele, o indivíduo não pode acessar educação pública, saúde, benefícios sociais ou participar do processo eleitoral."}
    ]'::jsonb
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'Desafios para a valorização de comunidades e povos tradicionais no Brasil',
    2022,
    'Análise das dificuldades enfrentadas por quilombolas, ribeirinhos, indígenas e outras comunidades tradicionais para preservar sua cultura e garantir direitos.',
    true,
    true,
    '[
      {"type": "text", "source": "Adaptado de: IBGE, 2022", "content": "O Brasil abriga mais de 300 povos indígenas e centenas de comunidades quilombolas, cada uma com língua, cultura e formas de organização próprias."},
      {"type": "text", "source": "Adaptado de: ISA — Instituto Socioambiental, 2022", "content": "A pressão do agronegócio, o garimpo ilegal e a falta de demarcação de terras ameaçam a existência física e cultural dessas comunidades."}
    ]'::jsonb
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'Desafios para o enfrentamento da violência contra povos indígenas no Brasil',
    2023,
    'Exame das causas e consequências da violência física, territorial e simbólica contra comunidades indígenas e os caminhos para sua proteção.',
    false,
    true,
    '[
      {"type": "text", "source": "Adaptado de: CIMI — Conselho Indigenista Missionário, 2023", "content": "Em 2022, o Brasil registrou 180 casos de violência contra indígenas, incluindo assassinatos, invasões de terra e omissão do poder público."},
      {"type": "text", "source": "Adaptado de: STF, ADI 3.239, 2018", "content": "O reconhecimento das terras indígenas como direito originário e imprescritível está previsto na Constituição, mas sua efetivação ainda esbarra em disputas políticas e econômicas."}
    ]'::jsonb
  ),
  (
    'a1000000-0000-0000-0000-000000000005',
    'Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil',
    2024,
    'Discussão sobre o trabalho doméstico e de cuidado não remunerado realizado majoritariamente por mulheres e seus impactos na desigualdade de gênero.',
    false,
    true,
    '[
      {"type": "text", "source": "Adaptado de: IBGE — PNAD Contínua, 2023", "content": "As mulheres dedicam em média 21,4 horas semanais a afazeres domésticos e cuidado de pessoas, contra 11 horas dos homens."},
      {"type": "text", "source": "Adaptado de: ONU Mulheres, 2023", "content": "O trabalho de cuidado não remunerado movimenta o equivalente a 10% do PIB mundial, mas permanece invisível nas estatísticas econômicas e nas políticas públicas."}
    ]'::jsonb
  ),
  (
    'a1000000-0000-0000-0000-000000000006',
    'Inteligência Artificial e ética: desafios para a sociedade brasileira',
    null,
    'Reflexão sobre os riscos, responsabilidades e marcos regulatórios necessários para o uso ético da IA no Brasil.',
    false,
    true,
    '[
      {"type": "text", "source": "Adaptado de: PL 2.338/2023 — Marco Legal da IA", "content": "O Brasil discute seu Marco Legal de Inteligência Artificial, buscando equilibrar inovação tecnológica com proteção de direitos fundamentais."},
      {"type": "text", "source": "Adaptado de: UNESCO, Recomendação sobre Ética da IA, 2021", "content": "A UNESCO recomenda que o desenvolvimento da IA seja orientado pelos princípios de transparência, responsabilidade e respeito à dignidade humana."}
    ]'::jsonb
  )
on conflict (id) do nothing;
