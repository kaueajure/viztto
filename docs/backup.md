# Backup e restauracao

O backup precisa conter banco e diretorio de uploads do mesmo instante logico.

## Exemplo manual

```bash
mysqldump --single-transaction --routines --triggers -u USUARIO -p BANCO > viztto-AAAA-MM-DD.sql
tar -czf viztto-uploads-AAAA-MM-DD.tar.gz uploads/
```

Armazene copias criptografadas fora do VPS, aplique retencao e teste restauracao periodicamente em ambiente isolado. Faça também uma cópia separada e criptografada das variáveis de ambiente; nunca inclua o `.env` em arquivos públicos, no Git ou em pacotes sem criptografia.

## Restauracao de teste

1. Crie um banco vazio separado.
2. Importe o SQL.
3. Restaure uploads no diretorio configurado.
4. Aponte uma instancia temporaria da aplicacao para esse banco.
5. Verifique login, materiais, versoes, comentarios, aprovacoes e arquivos.

Este repositorio nao executa backup ou restauracao automaticamente para evitar operacoes destrutivas silenciosas.
