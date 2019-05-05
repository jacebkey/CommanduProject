import passport from "passport";
import { Strategy } from "passport-local";
import { User } from "../entities";

const localStrategy = new Strategy(async (username, password, done) => {
    const user: User | undefined = await User.findOne({ where: { username } });

    if (!user || !user.authenticate(password)) {
        return done(null, false, { message: "Username or password incorrect." });
    }
    return done(null, user);
});

passport.use(localStrategy);
export const authLocal = passport.authenticate("local", { session: false });
