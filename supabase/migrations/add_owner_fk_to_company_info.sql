-- Adicionar chave estrangeira owner_id em company_info referenciando profiles
-- Isso é necessário para que o Supabase detecte a relação e permita o join

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'company_info_owner_id_fkey'
    ) THEN
        ALTER TABLE company_info
        ADD CONSTRAINT company_info_owner_id_fkey
        FOREIGN KEY (owner_id)
        REFERENCES profiles(id)
        ON DELETE SET NULL;
    END IF;
END $$;
