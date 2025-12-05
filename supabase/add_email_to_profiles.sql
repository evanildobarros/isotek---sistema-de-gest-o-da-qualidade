-- Alternativa: Adicionar campo email na tabela profiles
-- Esta é uma solução mais simples que não requer função RPC

-- 1. Adicionar coluna email na tabela profiles (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE profiles ADD COLUMN email text;
    END IF;
END $$;

-- 2. Criar trigger para sincronizar email automaticamente
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Buscar email do auth.users e atualizar no profile
    UPDATE profiles
    SET email = (SELECT email FROM auth.users WHERE id = NEW.id)
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar trigger que executa após insert/update em profiles
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
    AFTER INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_email();

-- 4. Atualizar emails existentes
UPDATE profiles p
SET email = (
    SELECT au.email 
    FROM auth.users au 
    WHERE au.id = p.id
)
WHERE p.email IS NULL OR p.email = '';

COMMENT ON COLUMN profiles.email IS 'Email do usuário sincronizado automaticamente de auth.users';
