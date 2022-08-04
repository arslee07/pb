use std::error::Error;

use jsonwebtoken::{decode, DecodingKey, Validation};

use crate::{models::User, Claims};

#[derive(Clone)]
pub struct UsersService {
    jwt_secret: String,
}

impl UsersService {
    pub fn new(jwt_secret: String) -> Self {
        UsersService { jwt_secret }
    }

    pub fn get_user_from_token(&self, token: String) -> Result<User, Box<dyn Error + Sync + Send>> {
        let mut validation = Validation::default();
        validation.validate_exp = false;

        let claims = decode::<Claims>(
            &token,
            &DecodingKey::from_secret(self.jwt_secret.as_ref()),
            &validation,
        )?
        .claims;

        Ok(User { id: claims.user_id })
    }
}
