-- Habilita extensões necessárias para agendamento e HTTP
-- O cron job em si é criado manualmente via SQL Editor (ver instruções em docs/DEPLOYMENT.md)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
