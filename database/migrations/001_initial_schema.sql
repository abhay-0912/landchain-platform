-- =============================================================================
-- Migration: 001_initial_schema
-- Description: Initial LandChain database schema
-- Created: 2024-01-01
-- =============================================================================
-- Run with: psql -U <user> -d <database> -f 001_initial_schema.sql
-- =============================================================================

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name               VARCHAR(255) NOT NULL,
    email                   VARCHAR(255) UNIQUE NOT NULL,
    password_hash           VARCHAR(255) NOT NULL,
    phone                   VARCHAR(20),
    government_id           VARCHAR(100),
    role                    VARCHAR(50)  NOT NULL DEFAULT 'citizen'
                                CHECK (role IN ('citizen', 'officer', 'bank', 'admin')),
    wallet_address          VARCHAR(42),
    kyc_status              VARCHAR(50)  DEFAULT 'pending'
                                CHECK (kyc_status IN ('pending', 'submitted', 'verified', 'rejected')),
    kyc_aadhaar_hash        VARCHAR(255),
    kyc_pan_hash            VARCHAR(255),
    kyc_address_proof_hash  VARCHAR(255),
    is_active               BOOLEAN      DEFAULT true,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PROPERTIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS properties (
    id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id             VARCHAR(50)  UNIQUE NOT NULL,
    survey_number           VARCHAR(100) UNIQUE NOT NULL,
    owner_id                UUID         NOT NULL REFERENCES users(id),
    area                    NUMERIC(12, 4) NOT NULL,
    coordinates             VARCHAR(255),
    latitude                DECIMAL(10, 8),
    longitude               DECIMAL(11, 8),
    city                    VARCHAR(100) NOT NULL,
    state                   VARCHAR(100) NOT NULL,
    land_type               VARCHAR(50)  DEFAULT 'residential'
                                CHECK (land_type IN ('residential', 'commercial', 'agricultural', 'industrial')),
    status                  VARCHAR(50)  DEFAULT 'active'
                                CHECK (status IN ('active', 'pending', 'transferred', 'disputed', 'mortgaged')),
    blockchain_property_id  BIGINT,
    blockchain_tx_hash      VARCHAR(66),
    ipfs_doc_hash           VARCHAR(255),
    registration_date       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_mortgaged            BOOLEAN      DEFAULT false,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- OWNERSHIP HISTORY
-- =============================================================================
CREATE TABLE IF NOT EXISTS ownership_history (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id         UUID        NOT NULL REFERENCES properties(id),
    owner_id            UUID        NOT NULL REFERENCES users(id),
    transfer_type       VARCHAR(50) NOT NULL
                            CHECK (transfer_type IN ('registration', 'sale', 'inheritance', 'mortgage_release', 'court_order')),
    transfer_date       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transaction_id      UUID,
    blockchain_tx_hash  VARCHAR(66),
    notes               TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- TRANSACTIONS  (property transfers)
-- =============================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id             UUID        NOT NULL REFERENCES properties(id),
    seller_id               UUID        NOT NULL REFERENCES users(id),
    buyer_id                UUID        NOT NULL REFERENCES users(id),
    transaction_type        VARCHAR(50) NOT NULL DEFAULT 'sale'
                                CHECK (transaction_type IN ('sale', 'inheritance', 'gift', 'court_order')),
    sale_price              NUMERIC(15, 2),
    status                  VARCHAR(50) DEFAULT 'pending'
                                CHECK (status IN ('pending', 'buyer_confirmed', 'officer_approved', 'completed', 'cancelled')),
    agreement_hash          VARCHAR(255),
    blockchain_transfer_id  BIGINT,
    blockchain_tx_hash      VARCHAR(66),
    initiated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at            TIMESTAMP WITH TIME ZONE,
    officer_id              UUID REFERENCES users(id),
    rejection_reason        TEXT,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- DOCUMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS documents (
    id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id         UUID         NOT NULL REFERENCES properties(id),
    uploaded_by         UUID         NOT NULL REFERENCES users(id),
    document_type       VARCHAR(100) NOT NULL
                            CHECK (document_type IN (
                                'sale_deed', 'registry_doc', 'tax_receipt', 'court_order',
                                'survey_map', 'mutation_order', 'mortgage_doc',
                                'identity_proof', 'other'
                            )),
    file_name           VARCHAR(255) NOT NULL,
    ipfs_hash           VARCHAR(255) NOT NULL,
    ipfs_url            VARCHAR(500),
    file_size           BIGINT,
    mime_type           VARCHAR(100),
    blockchain_verified BOOLEAN      DEFAULT false,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- MORTGAGES
-- =============================================================================
CREATE TABLE IF NOT EXISTS mortgages (
    id                     UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id            UUID         NOT NULL REFERENCES properties(id),
    bank_id                UUID         NOT NULL REFERENCES users(id),
    loan_amount            NUMERIC(15, 2) NOT NULL,
    loan_account_number    VARCHAR(100),
    start_date             TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date               TIMESTAMP WITH TIME ZONE,
    status                 VARCHAR(50)  DEFAULT 'active'
                               CHECK (status IN ('active', 'released', 'defaulted')),
    blockchain_mortgage_id BIGINT,
    blockchain_tx_hash     VARCHAR(66),
    ipfs_doc_hash          VARCHAR(255),
    notes                  TEXT,
    created_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- TAX RECORDS
-- =============================================================================
CREATE TABLE IF NOT EXISTS tax_records (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id         UUID        NOT NULL REFERENCES properties(id),
    tax_year            INTEGER     NOT NULL,
    amount              NUMERIC(12, 2) NOT NULL,
    due_date            TIMESTAMP WITH TIME ZONE,
    paid_date           TIMESTAMP WITH TIME ZONE,
    payment_reference   VARCHAR(100),
    status              VARCHAR(50) DEFAULT 'pending'
                            CHECK (status IN ('pending', 'paid', 'overdue', 'waived')),
    receipt_hash        VARCHAR(255),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, tax_year)
);

-- =============================================================================
-- APPROVALS
-- =============================================================================
CREATE TABLE IF NOT EXISTS approvals (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_type  VARCHAR(50) NOT NULL
                        CHECK (reference_type IN ('transfer', 'mutation', 'registration', 'dispute')),
    reference_id    UUID        NOT NULL,
    status          VARCHAR(50) DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected', 'info_requested')),
    officer_id      UUID REFERENCES users(id),
    submitted_by    UUID NOT NULL REFERENCES users(id),
    decision_date   TIMESTAMP WITH TIME ZONE,
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- AUDIT LOGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID         REFERENCES users(id),
    action        VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id   UUID,
    ip_address    INET,
    user_agent    TEXT,
    metadata      JSONB,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_properties_owner      ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_city       ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_status     ON properties(status);

CREATE INDEX IF NOT EXISTS idx_ownership_history_property ON ownership_history(property_id);

CREATE INDEX IF NOT EXISTS idx_transactions_property ON transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller   ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer    ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status   ON transactions(status);

CREATE INDEX IF NOT EXISTS idx_documents_property    ON documents(property_id);

CREATE INDEX IF NOT EXISTS idx_mortgages_property    ON mortgages(property_id);
CREATE INDEX IF NOT EXISTS idx_mortgages_bank        ON mortgages(bank_id);

CREATE INDEX IF NOT EXISTS idx_tax_records_property  ON tax_records(property_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user       ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created    ON audit_logs(created_at);

-- =============================================================================
-- AUTO-UPDATE updated_at TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mortgages_updated_at
    BEFORE UPDATE ON mortgages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_records_updated_at
    BEFORE UPDATE ON tax_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approvals_updated_at
    BEFORE UPDATE ON approvals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
