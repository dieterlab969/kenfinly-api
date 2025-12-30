-- Manual audit logs table creation (to use until migration is updated)
CREATE TABLE IF NOT EXISTS payment_gateway_audit_logs (
    id SERIAL PRIMARY KEY,
    payment_gateway_id BIGINT UNSIGNED,
    user_id BIGINT UNSIGNED NOT NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(255) DEFAULT 'payment_gateway',
    resource_id BIGINT UNSIGNED,
    description TEXT NOT NULL,
    old_values JSON,
    new_values JSON,
    metadata JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_gateway_id) REFERENCES payment_gateways(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_action ON payment_gateway_audit_logs(action);
CREATE INDEX idx_user_id ON payment_gateway_audit_logs(user_id);
CREATE INDEX idx_created_at ON payment_gateway_audit_logs(created_at);
