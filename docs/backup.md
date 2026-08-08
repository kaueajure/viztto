# Backup e restauracao

O backup precisa conter banco e arquivos de upload do mesmo instante logico.

## Disco local (`DIRETORIO_UPLOADS`)

```bash
mysqldump --single-transaction --routines --triggers -u USUARIO -p BANCO > viztto-AAAA-MM-DD.sql
tar -czf viztto-uploads-AAAA-MM-DD.tar.gz uploads/
```

## Object storage (`ARMAZENAMENTO_OBJETO_*`)

Altere o dump do MySQL como acima e faça snapshot/sync do bucket (ex.: `rclone sync` ou ferramenta do provedor). As chaves no bucket correspondem a `caminho_relativo` no banco.

Armazene copias criptografadas fora do VPS, aplique retencao e teste restauracao periodicamente em ambiente isolado. Faca tambem uma copia separada e criptografada das variaveis de ambiente; nunca inclua o `.env` em arquivos publicos, no Git ou em pacotes sem criptografia.

## Restauracao de teste

1. Crie um banco vazio separado.
2. Importe o SQL.
3. Restaure uploads no diretorio configurado **ou** no bucket.
4. Aponte uma instancia temporaria da aplicacao para esse banco (e as mesmas credenciais de objeto, se houver).
5. Verifique login, materiais, versoes, comentarios, aprovacoes e arquivos.

Este repositorio nao executa backup ou restauracao automaticamente para evitar operacoes destrutivas silenciosas.
