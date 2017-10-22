import {Class, classPrivateState} from "../../src/";
import {expect} from "test-drive";

let count = 0;

// state initializer
function initState(subj: Class<any>) {
    // content is meaningless. just make something unique and easy to debug
    return {
        subj,
        count: count++
    };
}

describe('Class private state', () => {
    const pState0 = classPrivateState('foo', initState);
    describe('.inherited', () => {
        it('returns state of own class if exists', () => {
            class F {
            }

            pState0(F); // init private state
            expect(pState0.inherited(F)).to.equal(pState0(F))
        });
        it('returns null if no state exists', () => {
            class F {
            }

            class G extends F {
            }

            expect(pState0.inherited(G)).to.equal(null)
        });
        it('returns state of super class if exists', () => {
            class F {
            }

            class G extends F {
            }

            pState0(F); // init private state
            expect(pState0.inherited(G)).to.equal(pState0(F))
        });
        it('does not return state of super class if own class has state', () => {
            class F {
            }

            class G extends F {
            }

            pState0(F); // init private state
            pState0(G); // init private state
            expect(pState0.inherited(G)).to.equal(pState0(G));
            expect(pState0.inherited(G)).to.not.equal(pState0(F));
        });
        describe('.origin', () => {
            it('returns argument if it has state', () => {
                class F {
                }

                pState0(F); // init private state
                expect(pState0.inherited.origin(F)).to.equal(F);
            });
            it('returns null if .inherited would return null for same argument', () => {
                class F {
                }

                class G extends F {
                }

                expect(pState0.inherited.origin(G)).to.equal(null);
            });
            it('returns super class if it has state', () => {
                class F {
                }

                class G extends F {
                }

                pState0(F); // init private state
                expect(pState0.inherited.origin(G)).to.equal(F)
            });
            it('does not return state of super class if own class has state', () => {
                class F {
                }

                class G extends F {
                }

                pState0(F); // init private state
                pState0(G); // init private state
                expect(pState0.inherited.origin(G)).to.equal(G);
                expect(pState0.inherited.origin(G)).to.not.equal(F);
            });
            describe('.hasState', () => {
                it('equals .inherited.hasState', () => {
                    expect(pState0.inherited.origin.hasState).to.equal(pState0.inherited.hasState)
                });
            });
            describe('.unsafe', () => {
                it('returns argument if it has state', () => {
                    class F {
                    }

                    pState0(F); // init private state
                    expect(pState0.inherited.origin.unsafe(F)).to.equal(F);
                });
                it('throws if no state exists', () => {
                    class F {
                    }

                    class G extends F {
                    }

                    expect(() => pState0.inherited.origin.unsafe(G)).to.throw();
                });
                it('returns super class if it has state', () => {
                    class F {
                    }

                    class G extends F {
                    }

                    pState0(F); // init private state
                    expect(pState0.inherited.origin.unsafe(G)).to.equal(F)
                });
                it('does not return state of super class if own class has state', () => {
                    class F {
                    }

                    class G extends F {
                    }

                    pState0(F); // init private state
                    pState0(G); // init private state
                    expect(pState0.inherited.origin.unsafe(G)).to.equal(G);
                    expect(pState0.inherited.origin.unsafe(G)).to.not.equal(F);
                });
            });
        });
        describe('.unsafe', () => {
            it('returns state of own class if exists', () => {
                class F {
                }

                pState0(F); // init private state
                expect(pState0.inherited.unsafe(F)).to.equal(pState0(F))
            });
            it('throws if no state exists', () => {
                class F {
                }

                class G extends F {
                }

                expect(() => pState0.inherited.unsafe(G)).to.throw();
            });
            it('returns state of super class if exists', () => {
                class F {
                }

                class G extends F {
                }

                pState0(F); // init private state
                expect(pState0.inherited.unsafe(G)).to.equal(pState0(F))
            });
            it('does not return state of super class if own class has state', () => {
                class F {
                }

                class G extends F {
                }

                pState0(F); // init private state
                pState0(G); // init private state
                expect(pState0.inherited.unsafe(G)).to.equal(pState0(G));
                expect(pState0.inherited.unsafe(G)).to.not.equal(pState0(F));
            });

            describe('.origin', () => {
                it('equals .origin.unsafe', () => {
                    expect(pState0.inherited.unsafe.origin).to.equal(pState0.inherited.origin.unsafe)
                });
            });
        });
        describe('.hasState', () => {
            it('returns true if exists in own class', () => {
                class F {
                }

                pState0(F); // init private state
                expect(pState0.inherited.hasState(F)).to.eql(true);
            });
            it('returns false if no state exists', () => {
                class F {
                }

                class G extends F {
                }

                expect(pState0.inherited.hasState(G)).to.eql(false)
            });
            it('returns true if exists in super', () => {
                class F {
                }

                class G extends F {
                }

                pState0(F); // init private state
                expect(pState0.inherited.hasState(G)).to.equal(true)
            })
        })
    });

    describe('.unsafe.inherited', () => {
        it('equals .inherited.unsafe', () => {
            expect(pState0.unsafe.inherited).to.equal(pState0.inherited.unsafe)
        });
    });
});
